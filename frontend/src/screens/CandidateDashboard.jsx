import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import RadarChart from '../components/RadarChart.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';

const tabs = ['Overview', 'Commits', 'Skills', 'Network'];
const activities = [
  ['Merged data-validation improvements into the contributor graph.', '2 hours ago', 'active'],
  ['AWS Solutions Architect certification was verified at source.', 'Yesterday', 'gold'],
  ['Completed the advanced graph algorithms learning path.', '3 days ago', ''],
];
const commits = [
  ['feat: add graph signal normalization', 'talentiq/verification-engine · 28 files changed', '2h ago'],
  ['fix: resolve edge-case in confidence model', 'talentiq/skill-graph · 11 files changed', '1d ago'],
  ['docs: publish contributor-quality rubric', 'aditi/engineering-notes · 1 file changed', '3d ago'],
];
const roadmap = [
  ['Distributed systems', 'Strengthen systems design signal'],
  ['Web3 architecture', 'Connect protocol-level proof of work'],
  ['Applied ML', 'Expand model evaluation fluency'],
];

function ActivityTimeline() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const update = () => setActiveIndex(Math.min(activities.length - 1, Math.floor(window.scrollY / 220)));
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return activities.map(([copy, time, accent], index) => (
    <div className="roadmap-item" key={copy} onMouseEnter={() => setActiveIndex(index)}>
      <i className={'timeline-dot ' + (accent === 'gold' ? 'gold' : '') + (activeIndex === index ? ' active' : '')} />
      <div><strong>{copy}</strong><span>{time}</span></div>
    </div>
  ));
}

function Overview({ candidate }) {
  return (
    <>
      <section className="glass-panel competency-panel">
        <div className="panel-heading">
          <div><div className="eyebrow">Live telemetry</div><h2>Competency Matrix</h2></div>
          <span className="chip chip-gold">Evidence weighted</span>
        </div>
        <div className="hologram"><RadarChart data={candidate.radar} /></div>
      </section>
      <section className="verified-grid">
        {[['code', 'GitHub', 'Connected'], ['workspace_premium', 'Credentials', 'Verified'], ['emoji_events', 'Hackathons', 'Scored'], ['groups', 'Network', 'Mapped']].map(([icon, label, status]) => (
          <div className="glass-panel glass-panel--interactive verified-card" key={label}>
            <span className="material-symbols-outlined">{icon}</span><strong>{label}</strong><span className="muted" style={{ display: 'block', marginTop: 4, fontSize: 11 }}>{status}</span>
          </div>
        ))}
      </section>
    </>
  );
}

function CommitsView() {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Proof of work</div><h2 className="section-heading" style={{ fontSize: 26 }}>Recent verified commits</h2>{commits.map(([title, detail, time], index) => <div className="commit-row" key={title}><i className={'timeline-dot ' + (index === 0 ? 'active' : '')} style={{ position: 'static', marginTop: 4 }} /><div><h3>{title}</h3><p>{detail}</p></div><time>{time}</time></div>)}</section>;
}

function SkillsView({ candidate }) {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Skill distribution</div><h2 className="section-heading" style={{ fontSize: 26 }}>Demonstrated technical depth</h2><div className="skill-bars">{candidate.radar.map((item, index) => <div key={item.axis}><div className="skill-label"><span>{item.axis}</span><b>{item.value}%</b></div><div className="skill-track"><div className="skill-fill" style={{ width: item.value + '%', animationDelay: index * 90 + 'ms' }} /></div></div>)}</div></section>;
}

function NetworkView() {
  const nodes = [['Aditi', 'central', '45%', '42%'], ['GraphQL', '', '17%', '21%'], ['React', '', '75%', '18%'], ['Node', '', '78%', '68%'], ['AWS', '', '22%', '73%'], ['tRPC', '', '50%', '80%']];
  return <section className="glass-panel alternate-view"><div className="eyebrow">Neo4j talent graph</div><h2 className="section-heading" style={{ fontSize: 26 }}>Your connected skill network</h2><div className="network-view"><i className="network-line" style={{ left: '49%', top: '50%', width: '35%', transform: 'rotate(-31deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '33%', transform: 'rotate(-143deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '34%', transform: 'rotate(36deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '32%', transform: 'rotate(146deg)' }} />{nodes.map(([label, cls, left, top]) => <span key={label} className={cls} style={{ left, top }}>{label}</span>)}</div></section>;
}

export default function CandidateDashboard() {
  const { candidates } = useApp();
  const candidate = candidates[0];
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role="candidate" />
      <main className="content-wrap dashboard-layout">
        <section>
          <header className="glass-panel dashboard-hero">
            <div>
              <div className="eyebrow">Personal telemetry center</div>
              <h1>{candidate.name}</h1>
              <p>{candidate.title} · Your verified proof-of-work cockpit.</p>
              <div className="dossier-skills">{candidate.skills.slice(0, 4).map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div>
            </div>
            <ScoreRing score={candidate.talentScore} size={138} label="Talent score" />
          </header>
          <div className="tab-list" role="tablist" aria-label="Candidate dashboard views">
            {tabs.map((tab) => <button className={'tab ' + (activeTab === tab ? 'active' : '')} role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          {activeTab === 'Overview' && <Overview candidate={candidate} />}
          {activeTab === 'Commits' && <CommitsView />}
          {activeTab === 'Skills' && <SkillsView candidate={candidate} />}
          {activeTab === 'Network' && <NetworkView />}
        </section>

        <aside className="side-stack">
          <section className="glass-panel side-card">
            <div className="panel-heading"><div><div className="eyebrow">Growth signal</div><h2>Career Roadmap</h2></div><Link to="/interview" className="icon-button" aria-label="Practice for your next assessment"><span className="material-symbols-outlined">arrow_outward</span></Link></div>
            <div style={{ marginTop: 12 }}>{roadmap.map(([name, detail], index) => <div className="roadmap-item" key={name}><i className={'timeline-dot ' + (index === 0 ? 'active' : '')} /><div><strong>{name}</strong><span>{detail}</span></div></div>)}</div>
          </section>
          <section className="glass-panel side-card">
            <div className="eyebrow">Activity stream</div>
            <h2 className="font-space" style={{ margin: '10px 0 9px', fontSize: 20, letterSpacing: '-.03em' }}>Recent activity</h2>
            <div>{<ActivityTimeline />}</div>
          </section>
        </aside>
      </main>
    </div>
  );
}
