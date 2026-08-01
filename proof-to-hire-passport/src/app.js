import { candidate, role, buildPassport, evidenceConfidence } from './passport.js';

const passport = buildPassport(candidate, role);
const percent = (value) => `${value}%`;

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#top">TalentIQ <span>PROOF</span></a><p>Recruiter decision workspace</p><button id="share" class="ghost">Copy secure share link</button></header>
    <section id="top" class="hero">
      <div><p class="eyebrow">ROLE-SPECIFIC PROOF-TO-HIRE PASSPORT</p><h1>${candidate.name}</h1><p class="headline">${candidate.headline}</p><p class="muted">${candidate.location} · Evidence collected with candidate consent</p></div>
      <div class="decision"><span>Recommendation</span><strong>${passport.decision}</strong><p>Human review required</p></div>
    </section>
    <section class="metrics" aria-label="passport summary">
      <article><span>Role readiness</span><strong>${percent(passport.readiness)}</strong><small>for ${role.title}</small></article>
      <article><span>Evidence confidence</span><strong>${percent(passport.confidence)}</strong><small>source quality + recency</small></article>
      <article><span>Trust risk</span><strong class="risk">${passport.risk}/100</strong><small>two items to review</small></article>
      <article><span>Evidence sources</span><strong>${candidate.evidence.length}</strong><small>independent proof cards</small></article>
    </section>
    <section class="grid">
      <article class="panel proof-graph"><div class="section-title"><div><p class="eyebrow">EXPLAINABILITY</p><h2>Competency proof graph</h2></div><span class="pill">${role.title}</span></div>
        ${passport.competencyResults.map((item) => `<div class="competency"><div class="competency-label"><strong>${item.label}</strong><span>${item.score}%</span></div><div class="bar"><i style="width:${item.score}%"></i></div><p>${item.supporting.map((evidence) => evidence.type).join(' · ')}</p></div>`).join('')}
      </article>
      <aside class="panel next-step"><p class="eyebrow">NEXT BEST EVALUATION</p><h2>Close the ${passport.weakest.label.toLowerCase()} gap</h2><p>Ask the candidate to explain how they would monitor an AI feature after launch: quality metrics, drift, privacy, and rollback.</p><button id="advance">Move to targeted interview</button><button class="text-button">View structured interview guide →</button></aside>
    </section>
    <section class="panel evidence"><div class="section-title"><div><p class="eyebrow">SOURCE-LINKED PROOF</p><h2>Evidence trail</h2></div><span class="muted">Click any card to inspect its source</span></div>
      <div class="evidence-list">${candidate.evidence.map((item) => `<button class="evidence-card" data-id="${item.id}"><span class="evidence-type">${item.type}</span><strong>${item.title}</strong><p>${item.note}</p><footer><span>${item.source}</span><b>${evidenceConfidence(item)}% confidence</b></footer></button>`).join('')}</div>
    </section>
    <section class="grid lower"><article class="panel"><p class="eyebrow">TRUST & UNCERTAINTY</p><h2>What still needs review</h2><ul class="risks">${candidate.risks.map((risk) => `<li><span class="dot ${risk.severity}"></span><div><strong>${risk.label}</strong><p>${risk.detail}</p></div></li>`).join('')}</ul></article><article class="panel"><p class="eyebrow">CANDIDATE CONTROL</p><h2>Consented evidence only</h2><p>Every proof item is source-linked, time-stamped, versionable, and visible to the candidate. Recruiter views are auditable and access can be revoked.</p><button class="text-button">Open consent record →</button></article></section>
  </main><dialog id="dialog"><button class="close" aria-label="close">×</button><div id="dialog-content"></div></dialog>`;

const dialog = document.querySelector('#dialog');
document.querySelectorAll('.evidence-card').forEach((card) => card.addEventListener('click', () => {
  const item = candidate.evidence.find((evidence) => evidence.id === card.dataset.id);
  document.querySelector('#dialog-content').innerHTML = `<p class="eyebrow">EVIDENCE INSPECTION</p><h2>${item.title}</h2><p>${item.note}</p><dl><dt>Source</dt><dd>${item.source}</dd><dt>Collected</dt><dd>${item.collectedAt}</dd><dt>Confidence</dt><dd>${evidenceConfidence(item)}%</dd></dl>`;
  dialog.showModal();
}));
document.querySelector('.close').addEventListener('click', () => dialog.close());
document.querySelector('#advance').addEventListener('click', (event) => { event.currentTarget.textContent = 'Interview queued ✓'; event.currentTarget.disabled = true; });
document.querySelector('#share').addEventListener('click', (event) => { navigator.clipboard?.writeText(location.href); event.currentTarget.textContent = 'Link copied ✓'; });
