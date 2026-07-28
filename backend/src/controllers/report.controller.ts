import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const getTalentReport = async (req: Request, res: Response) => {
  const c = candidates.find(c => c.id === req.params.id);
  if (!c) { res.status(404).json({ error: 'Candidate not found' }); return; }
  res.json({ candidate: c, report: {
    summary: `${c.name} is a ${c.title} with a talent score of ${c.talentScore}. Strongest in ${c.skills.slice(0, 3).join(', ')}.`,
    evidence: { github: { score: c.githubScore, desc: c.githubDesc }, hackathons: { score: c.hackathonScore, desc: c.hackathonDesc }, certifications: { score: c.certScore, desc: c.certDesc }, presentations: { score: c.presentationScore, desc: c.presentationDesc }, openSource: { score: c.openSourceScore, desc: c.openSourceDesc }, social: { score: c.socialScore, desc: c.socialDesc } },
    decision: { recommended: c.talentScore >= 85, confidence: c.talentScore },
  }});
};

export const exportTalentReportPdf = async (req: Request, res: Response) => {
  res.json({ url: `/reports/${req.params.id}/report.pdf`, message: 'PDF generation queued' });
};

export const shareReport = async (req: Request, res: Response) => {
  res.json({ shareUrl: `/shared/${req.params.id}`, expiresAt: new Date(Date.now() + 7 * 86400000) });
};
