import React from 'react';
import { Link } from 'react-router-dom';
import SpaceFabric from '../components/SpaceFabric.jsx';
import TopNav from '../components/TopNav.jsx';

export default function ProductModule({ module }) {
  return <div className="space-page module-page"><SpaceFabric className="page-fabric" /><TopNav role={module.role} />
    <main className="content-wrap module-layout">
      <section className="glass-panel module-hero"><div className="module-icon"><span className="material-symbols-outlined">{module.icon}</span></div><div className="eyebrow">{module.eyebrow}</div><h1>{module.title}</h1><p>{module.description}</p></section>
      <section className="module-metrics">{module.metrics.map(([label, value]) => <article className="glass-panel glass-panel--interactive module-metric" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
      <section className="glass-panel module-plan"><div><div className="eyebrow">Product flow</div><h2>Designed for clear next steps.</h2></div><ol>{module.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol></section>
      <section className="module-links">{module.links.map(([label, to, icon]) => <Link className="glass-panel glass-panel--interactive module-link" to={to} key={label}><span className="material-symbols-outlined">{icon}</span><span>{label}</span><span className="material-symbols-outlined module-link-arrow">arrow_forward</span></Link>)}</section>
    </main>
  </div>;
}
