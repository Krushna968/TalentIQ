import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { computeTalentIntelligence, getStoredIntelligence, careerTimeline } from '../services/intelligence.service.js';
import { latestAgentResults } from '../agents/orchestrator.js';
import { candidateGraph, similarCandidates, storeResearch, readResearch } from '../services/knowledge-graph.service.js';
import { listBadges } from '../services/career.service.js';
import { resolveCandidateId } from '../middleware/auth.middleware.js';
import { handle, param, notFound } from '../utils/http.js';

/** Builds the full explainable talent dossier. */
async function buildReport(candidateId: string, recompute: boolean) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, title: true, avatar: true, location: true, bio: true, email: true },
  });
  if (!candidate) throw notFound('Candidate not found');

  const intelligence = recompute
    ? await computeTalentIntelligence(candidateId)
    : (await getStoredIntelligence(candidateId)) ?? (await computeTalentIntelligence(candidateId));

  const [agents, badges, timeline, similar, graph] = await Promise.all([
    latestAgentResults(candidateId),
    listBadges(candidateId),
    careerTimeline(candidateId),
    similarCandidates(candidateId, 5),
    candidateGraph(candidateId),
  ]);

  const talentScore = intelligence.talentScore;
  // A stored snapshot keeps confidence and the rationale inside `signals`;
  // a freshly computed one exposes them as top-level fields.
  const stored = 'signals' in intelligence ? (intelligence.signals as { confidence?: number; explanation?: string[] }) : {};
  const confidence = 'confidence' in intelligence ? intelligence.confidence : (stored.confidence ?? 0);
  const rationale = 'explanation' in intelligence ? intelligence.explanation : (stored.explanation ?? []);

  return {
    candidate,
    intelligence,
    agents: Object.entries(agents).map(([name, result]) => ({
      agent: name,
      score: result.score,
      confidence: result.confidence,
      engine: result.engine,
      summary: result.summary,
      components: result.components,
    })),
    badges,
    timeline,
    similarCandidates: similar,
    knowledgeGraph: { nodes: graph.nodes.length, edges: graph.edges.length },
    decision: { recommended: talentScore >= 75, confidence, rationale },
    generatedAt: new Date(),
  };
}

export const getTalentReport = handle<AuthenticatedRequest, Response>('report.talent', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.id);
  res.json(await buildReport(candidateId, param(req.query.refresh) === 'true'));
});

/**
 * Renders the dossier as a self-contained printable HTML document. The browser
 * or the frontend's print dialog produces the PDF, which avoids shipping a
 * headless-browser dependency for one endpoint.
 */
export const exportTalentReportPdf = handle<AuthenticatedRequest, Response>('report.export', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.id);
  const report = await buildReport(candidateId, false);

  const escape = (value: unknown) =>
    String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] || char);

  const row = (label: string, value: unknown) => `<tr><th>${escape(label)}</th><td>${escape(value)}</td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Talent report — ${escape(report.candidate.name)}</title>
<style>
 body{font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:820px;margin:40px auto;padding:0 24px}
 h1{margin:0 0 4px} h2{margin-top:32px;border-bottom:1px solid #ddd;padding-bottom:6px}
 .muted{color:#666} table{border-collapse:collapse;width:100%;margin:12px 0}
 th,td{text-align:left;padding:6px 10px;border-bottom:1px solid #eee;vertical-align:top}
 th{width:230px;font-weight:600;color:#444} .score{font-size:44px;font-weight:700}
 ul{margin:8px 0;padding-left:20px} @media print{body{margin:0}}
</style></head><body>
<h1>${escape(report.candidate.name)}</h1>
<p class="muted">${escape(report.candidate.title || 'Candidate')}${report.candidate.location ? ` · ${escape(report.candidate.location)}` : ''}</p>
<p class="score">${escape(report.intelligence.talentScore)}<span class="muted" style="font-size:16px">/100 talent score</span></p>

<h2>Dimension scores</h2>
<table>
${row('Technical', report.intelligence.technicalScore)}
${row('Innovation', report.intelligence.innovationScore)}
${row('Leadership', report.intelligence.leadershipScore)}
${row('Growth potential', report.intelligence.growthScore)}
${row('Learning ability', report.intelligence.learningScore)}
${row('Authenticity', report.intelligence.authenticityScore)}
${row('Risk', report.intelligence.riskScore)}
</table>

<h2>Evidence sources</h2>
<table>${report.agents.map((agent) => row(agent.agent, `${agent.score}/100 — ${agent.summary}`)).join('')}</table>

<h2>How this score was reached</h2>
<ul>${(report.decision.rationale as string[]).map((line) => `<li>${escape(line)}</li>`).join('')}</ul>

<h2>Verified badges</h2>
<ul>${report.badges.filter((badge) => badge.earned).map((badge) => `<li>${escape(badge.label)} — ${escape(badge.description)}</li>`).join('') || '<li>None earned yet</li>'}</ul>

<p class="muted" style="margin-top:40px">Generated by TalentIQ on ${escape(new Date().toISOString())}. Every figure above is derived from evidence held by the platform.</p>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="talent-report-${candidateId}.html"`);
  res.send(html);
});

export const shareReport = handle<AuthenticatedRequest, Response>('report.share', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.id);
  const token = randomBytes(18).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 86_400_000);

  await storeResearch('shared-report', token, { candidateId, expiresAt: expiresAt.toISOString(), sharedBy: req.user!.id }, candidateId);
  res.json({ shareUrl: `/api/reports/shared/${token}`, token, expiresAt });
});

/** Public read of a shared dossier. No authentication, but the link expires. */
export const getSharedReport = handle<AuthenticatedRequest, Response>('report.shared', async (req, res) => {
  const record = await readResearch<{ candidateId: string; expiresAt: string }>('shared-report', param(req.params.token));
  if (!record) throw notFound('This share link is not valid');
  if (new Date(record.expiresAt).getTime() < Date.now()) throw notFound('This share link has expired');

  const report = await buildReport(record.candidateId, false);
  // A public link never exposes contact details.
  res.json({ ...report, candidate: { ...report.candidate, email: undefined } });
});

export const getKnowledgeGraph = handle<AuthenticatedRequest, Response>('report.graph', async (req, res) => {
  res.json(await candidateGraph(resolveCandidateId(req, req.params.id)));
});
