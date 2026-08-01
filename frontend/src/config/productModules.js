import { ROUTES } from '../routes/paths.js';

const createModule = ({
  role, eyebrow, title, icon, accent = '#00e5ff', badge, description,
  metrics = [], steps = [], links = [], sandbox = {}
}) => ({
  role, eyebrow, title, icon, accent, badge, description, metrics, steps, links, sandbox
});

export const productModules = {
  candidateProfile: createModule({
    role: 'candidate',
    eyebrow: 'Digital talent identity',
    title: 'Your verified professional signal.',
    icon: 'fingerprint',
    accent: '#00e5ff', // Neon Cyan
    badge: 'Cryptographic Proof Protocol',
    description: 'Connect the work you are proud of, then turn it into a single evidence-led profile that recruiters can trust without asking anyone to take your word for it.',
    metrics: [
      { label: 'Evidence sources', value: '06', chip: '+2 SOURCE SYNC', progress: 85 },
      { label: 'Verified skills', value: '24', chip: '100% AUDITABLE', progress: 92 },
      { label: 'Profile strength', value: '94%', chip: 'TOP 5% SIGNAL', progress: 94 },
    ],
    steps: [
      { title: 'Connect Work Workspaces', desc: 'Connect GitHub repositories, portfolio deployments, credentials, and hackathon achievements.', tag: 'Zero-Config Ingestion' },
      { title: 'Inspect Attributed Evidence', desc: 'Review the verifiable cryptographic evidence automatically attached to every technical skill.', tag: 'Explainable AI' },
      { title: 'Share Unified Passport', desc: 'Share one trusted, tamper-proof digital talent identity with high-tier engineering employers.', tag: 'Verified Network' }
    ],
    links: [
      { label: 'Open talent cockpit', to: ROUTES.CANDIDATE_OVERVIEW, icon: 'space_dashboard', desc: 'Return to your main telemetry center' },
      { label: 'Practice interview', to: ROUTES.INTERVIEW, icon: 'record_voice_over', desc: 'Test skills with the live AI agent' },
      { label: 'View career roadmap', to: ROUTES.CANDIDATE_ROADMAP, icon: 'route', desc: 'See high-impact career recommendations' }
    ],
    sandbox: {
      title: 'Simulate Identity Synthesis',
      desc: 'Test drive how TalentIQ extracts raw repository commits and transforms them into verifiable talent attributes.',
      btnText: 'Execute Signal Synthesis',
      logs: [
        { time: '0.2s', text: 'Initializing GitHub OAuth cryptographic stream...', type: 'info' },
        { time: '0.6s', text: 'Extracting AST from 42 pull requests across distributed consensus repo...', type: 'info' },
        { time: '1.2s', text: 'Algorithmic Complexity Weight identified: 94.2 / 100', type: 'highlight' },
        { time: '1.6s', text: '✓ Verified competency node appended to Digital Talent Identity.', type: 'success' }
      ]
    }
  }),

  candidateRoadmap: createModule({
    role: 'candidate',
    eyebrow: 'Career intelligence',
    title: 'A clearer next move for your career.',
    icon: 'route',
    accent: '#ffd54f', // Electric Gold
    badge: 'Predictive Trajectory Engine',
    description: 'Prioritise the skills, architecture designs, and proof points that will make the greatest quantitative difference to your next career jump.',
    metrics: [
      { label: 'Growth opportunities', value: '03', chip: 'HIGH ROI', progress: 75 },
      { label: 'Current trajectory', value: 'Strong', chip: 'PRINCIPAL LEVEL', progress: 88 },
      { label: 'Next review cycle', value: '14 days', chip: 'ACTIVE TRACKING', progress: 65 },
    ],
    steps: [
      { title: 'Systems Design Architecture', desc: 'Strengthen systems design signal with one deployed case study or RFC document.', tag: 'High Impact Gap' },
      { title: 'Document Architectural Choices', desc: 'Publish architectural tradeoff reasoning in your most active repository README.', tag: 'Communication Signal' },
      { title: 'Complete AI Assessment', desc: 'Complete a practice AI technical assessment and attach the verified outcome to your profile.', tag: 'Verified Proof' }
    ],
    links: [
      { label: 'Open talent cockpit', to: ROUTES.CANDIDATE_OVERVIEW, icon: 'space_dashboard', desc: 'Return to your main telemetry center' },
      { label: 'Build your identity', to: ROUTES.CANDIDATE_PROFILE, icon: 'fingerprint', desc: 'Manage connected repositories and certificates' },
      { label: 'Practice interview', to: ROUTES.INTERVIEW, icon: 'record_voice_over', desc: 'Test skills with the live AI agent' }
    ],
    sandbox: {
      title: 'Run Career Trajectory Simulation',
      desc: 'Simulate how completing a systems design architecture document elevates your match percentile across executive hiring pipelines.',
      btnText: 'Simulate Trajectory Leap',
      logs: [
        { time: '0.3s', text: 'Loading target role taxonomy: Principal Systems Architect...', type: 'info' },
        { time: '0.7s', text: 'Simulating ingestion of Kafka distributed log consensus case study...', type: 'info' },
        { time: '1.3s', text: 'Match probability for Tier-1 Infrastructure roles increases by +28%', type: 'highlight' },
        { time: '1.7s', text: '✓ Career roadmap updated with high-confidence milestone optimization.', type: 'success' }
      ]
    }
  }),

  recruiterPipeline: createModule({
    role: 'recruiter',
    eyebrow: 'Hiring workspace',
    title: 'Move qualified talent forward with confidence.',
    icon: 'account_tree',
    accent: '#8b5cff', // Neon Purple
    badge: 'Defensible Hiring Workspace',
    description: 'Keep every verified shortlist, line-item evidence review, and collaborative decision in one high-signal, noise-free hiring workspace.',
    metrics: [
      { label: 'Active candidates', value: '18', chip: '99.4% MATCHED', progress: 90 },
      { label: 'Evidence reviewed', value: '12', chip: 'READY FOR REVIEW', progress: 67 },
      { label: 'Ready to interview', value: '05', chip: 'HIGH CONFIDENCE', progress: 80 },
    ],
    steps: [
      { title: 'Review Copilot Matches', desc: 'Review high-signal candidates automatically surfaced by the Copilot semantic engine.', tag: 'Semantic Discovery' },
      { title: 'Inspect Explanatory Proofs', desc: 'Open the explainable code evidence behind every talent score before initiating contact.', tag: 'Zero Blind Guessing' },
      { title: 'Accelerate Finalist Interviews', desc: 'Move validated engineering finalists directly into an interview-ready active shortlist.', tag: 'Rapid Velocity' }
    ],
    links: [
      { label: 'Search talent', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'Ask Copilot for custom verified talent' },
      { label: 'Compare candidates', to: ROUTES.RECRUITER_COMPARE, icon: 'compare_arrows', desc: 'Compare side-by-side evidence trails' },
      { label: 'Open featured dossier', to: ROUTES.TALENT_REPORT('elena-rodriguez'), icon: 'description', desc: 'Inspect Elena Rodriguez live intelligence report' }
    ],
    sandbox: {
      title: 'Test Pipeline Evidence Filter',
      desc: 'Watch how TalentIQ automatically weeds out resume inflation by filtering a raw applicant pipeline against GitHub proof points.',
      btnText: 'Run Automated Verification',
      logs: [
        { time: '0.2s', text: 'Scanning 140 incoming applicant resumes against Git commits...', type: 'info' },
        { time: '0.8s', text: 'Flagged 34 profiles with zero attributable backend code execution.', type: 'info' },
        { time: '1.4s', text: 'Surfaced 18 candidates exhibiting top 1% algorithmic consistency.', type: 'highlight' },
        { time: '1.8s', text: '✓ Pipeline optimized: interview conversion confidence raised to 94.2%.', type: 'success' }
      ]
    }
  }),

  recruiterCompare: createModule({
    role: 'recruiter',
    eyebrow: 'Decision intelligence',
    title: 'Compare evidence, not just self-reported resumes.',
    icon: 'compare_arrows',
    accent: '#00e5ff',
    badge: 'Multi-Dimensional Vector Analysis',
    description: 'Evaluate candidates side-by-side across verified algorithmic depth, commit consistency, delivery velocity, and collaborative standing from one decision-ready view.',
    metrics: [
      { label: 'Comparison axes', value: '06', chip: 'MULTI-MODAL', progress: 100 },
      { label: 'Candidate slots', value: '04', chip: 'LIVE SYNC', progress: 80 },
      { label: 'Evidence freshness', value: 'Live', chip: '< 60S DELTA', progress: 98 },
    ],
    steps: [
      { title: 'Select Shortlisted Finalists', desc: 'Choose top finalists directly from your verified active hiring pipeline.', tag: 'Side-by-Side' },
      { title: 'Customize Signal Weights', desc: 'Weight the technical signals that matter most for this specific architectural role.', tag: 'Dynamic Scoring' },
      { title: 'Export Decision Dossier', desc: 'Open and attach the cryptographic evidence trail before briefing hiring committees.', tag: 'Audit Trail' }
    ],
    links: [
      { label: 'Search talent', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'Find additional candidates to compare' },
      { label: 'Open pipeline', to: ROUTES.RECRUITER_PIPELINE, icon: 'account_tree', desc: 'Manage stage progressions' },
      { label: 'View Elena’s dossier', to: ROUTES.TALENT_REPORT('elena-rodriguez'), icon: 'description', desc: 'Inspect full verified dossier' }
    ],
    sandbox: {
      title: 'Execute Matrix Comparison',
      desc: 'Simulate a side-by-side vector alignment between two Senior Kubernetes specialists to uncover subtle architectural strength differences.',
      btnText: 'Run Vector Comparison',
      logs: [
        { time: '0.2s', text: 'Aligning competency matrix: Candidate A vs Candidate B...', type: 'info' },
        { time: '0.6s', text: 'Analyzing custom operator pull requests and concurrency debugging patterns...', type: 'info' },
        { time: '1.2s', text: 'Candidate A exhibits +18% higher proficiency in fault-tolerant Go systems.', type: 'highlight' },
        { time: '1.5s', text: '✓ Comparative decision brief generated with verifiable line-item citations.', type: 'success' }
      ]
    }
  }),

  verification: createModule({
    role: 'candidate',
    eyebrow: 'Trust layer',
    title: 'Cryptographic evidence that holds up under rigorous review.',
    icon: 'verified_user',
    accent: '#10b981', // Emerald Signal
    badge: 'Tamper-Proof Proof Engine',
    description: 'Every single profile attribute is directly anchored to commit histories, credential registries, and code execution outputs so confidence is effortless to inspect.',
    metrics: [
      { label: 'Signals checked', value: '48', chip: 'AUTOMATED AST', progress: 96 },
      { label: 'Integrity score', value: '99.4%', chip: 'ZERO ALTERATION', progress: 99 },
      { label: 'Verification state', value: 'Active', chip: 'REAL-TIME HOOK', progress: 100 },
    ],
    steps: [
      { title: 'Connect Auth Repositories', desc: 'Collect source-backed cryptographic proof from OAuth linked developer platforms.', tag: 'Secure Protocol' },
      { title: 'Neural Taxonomy Mapping', desc: 'Map thousands of varied technologies into a structured, unified competency graph.', tag: 'Graph Neural Net' },
      { title: 'Publish Explanatory Citations', desc: 'Expose a readable, verifiable proof trail for engineering managers and tech leads.', tag: 'Transparent XAI' }
    ],
    links: [
      { label: 'Build your identity', to: ROUTES.CANDIDATE_PROFILE, icon: 'fingerprint', desc: 'Review your verified credentials' },
      { label: 'Explore talent network', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'See how verified profiles appear to leads' },
      { label: 'View featured dossier', to: ROUTES.TALENT_REPORT('elena-rodriguez'), icon: 'description', desc: 'Examine live verifiable citations' }
    ],
    sandbox: {
      title: 'Test Code Execution Verifier',
      desc: 'Trigger an automated validation pass over a submitted Python ML repository to verify authentic authorship and algorithm depth.',
      btnText: 'Verify Code Repository',
      logs: [
        { time: '0.2s', text: 'Verifying commit PGP signatures and commit timestamp distribution...', type: 'info' },
        { time: '0.6s', text: 'Executing static AST analysis on PyTorch transformer training loop...', type: 'info' },
        { time: '1.1s', text: 'Authorship confidence validated at 99.8% via syntactic styling consistency.', type: 'highlight' },
        { time: '1.4s', text: '✓ Cryptographic verification badge successfully issued and stamped.', type: 'success' }
      ]
    }
  }),

  matching: createModule({
    role: 'recruiter',
    eyebrow: 'Role fit engine',
    title: 'Find the high-signal truth behind every match.',
    icon: 'hub',
    accent: '#8b5cff',
    badge: 'Neural Matchmaking Matrix',
    description: 'Bring verified skills, production repository proofs, collaborative delivery history, and learning trajectory together to compute defensible match scores.',
    metrics: [
      { label: 'Signals evaluated', value: '12', chip: 'HOLISTIC VECTOR', progress: 95 },
      { label: 'Top match accuracy', value: '96.2%', chip: 'DEFENSIBLE SIGNAL', progress: 96 },
      { label: 'Role readiness', value: 'Immediate', chip: 'LOW ONBOARDING', progress: 90 },
    ],
    steps: [
      { title: 'Define Semantic Role Criteria', desc: 'Describe engineering responsibilities in natural language or import internal engineering matrices.', tag: 'Natural NLP' },
      { title: 'Weight Production Signals', desc: 'Prioritise specific architectural patterns or system design proof points over raw keyword counts.', tag: 'Smart Weights' },
      { title: 'Inspect Ranked Shortlist', desc: 'Review ranked engineering profiles accompanied by explicit line-item match explanations.', tag: 'No Black Box' }
    ],
    links: [
      { label: 'Search talent', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'Test matching engine in live Copilot search' },
      { label: 'Compare candidates', to: ROUTES.RECRUITER_COMPARE, icon: 'compare_arrows', desc: 'Evaluate match breakdown side by side' },
      { label: 'Review hiring pipeline', to: ROUTES.RECRUITER_PIPELINE, icon: 'account_tree', desc: 'See match score distributions in workspace' }
    ],
    sandbox: {
      title: 'Simulate Neural Role Match',
      desc: 'Test how the engine calculates a 96% match score between a candidate’s verified Go microservices proof and an open Sr Backend engineering role.',
      btnText: 'Compute Fit Score',
      logs: [
        { time: '0.3s', text: 'Parsing requirements: High-throughput Go microservices + gRPC + Redis...', type: 'info' },
        { time: '0.7s', text: 'Matching against candidate vector space: 14 Go repositories identified...', type: 'info' },
        { time: '1.2s', text: 'gRPC latency optimization proof detected in recent open source PRs.', type: 'highlight' },
        { time: '1.6s', text: '✓ Defensible match calculated: 96.2% confidence score established.', type: 'success' }
      ]
    }
  }),

  analytics: createModule({
    role: 'recruiter',
    eyebrow: 'Hiring intelligence',
    title: 'See exactly where your verified hiring signal is strongest.',
    icon: 'query_stats',
    accent: '#00e5ff',
    badge: 'Executive Funnel Telemetry',
    description: 'Turn your overall talent pipeline into an actionable operating view of signal quality, hiring velocity, verification depth, and decision defensibility.',
    metrics: [
      { label: 'Talent pool indexed', value: '1,420', chip: '+14% THIS MONTH', progress: 88 },
      { label: 'Avg audit confidence', value: '94.2%', chip: 'TOP TIER QUALITY', progress: 94 },
      { label: 'Shortlist velocity', value: '2.4x', chip: 'FASTER HIRES', progress: 92 },
    ],
    steps: [
      { title: 'Track Verified Sources', desc: 'Identify which specific developer networks and open source ecosystems yield your highest performers.', tag: 'Source Attribution' },
      { title: 'Eliminate Review Bottlenecks', desc: 'Spot and resolve unnecessary delay phases between candidate discovery and technical interviews.', tag: 'Velocity Insights' },
      { title: 'Measure Decision Defensibility', desc: 'Use verified evidence coverage metrics to justify hiring committee decisions with hard numbers.', tag: 'Executive Metrics' }
    ],
    links: [
      { label: 'Search talent', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'Add new high-signal talent to funnels' },
      { label: 'Open pipeline', to: ROUTES.RECRUITER_PIPELINE, icon: 'account_tree', desc: 'Inspect active candidate velocities' },
      { label: 'Explore matching', to: ROUTES.MATCHING, icon: 'hub', desc: 'Review fit score parameters' }
    ],
    sandbox: {
      title: 'Generate Executive Funnel Report',
      desc: 'Simulate real-time analytics aggregation across 1,400 active profiles to reveal interview pass rate improvements under verified AI matching.',
      btnText: 'Aggregate Funnel Data',
      logs: [
        { time: '0.2s', text: 'Aggregating verification metrics across 1,420 candidate dossiers...', type: 'info' },
        { time: '0.6s', text: 'Correlating GitHub verified scores with historical technical interview outcomes...', type: 'info' },
        { time: '1.1s', text: 'Insight discovered: Candidates with >85 GitHub score pass technical screens at 89% rate.', type: 'highlight' },
        { time: '1.5s', text: '✓ Analytics executive summary generated and ready for committee export.', type: 'success' }
      ]
    }
  }),

  interviewReport: createModule({
    role: 'candidate',
    eyebrow: 'Interview intelligence',
    title: 'Understand the quantitative signal behind your performance.',
    icon: 'fact_check',
    accent: '#ffd54f',
    badge: 'AI Diagnostic Telemetry',
    description: 'Review a highly structured, line-by-line breakdown of technical depth, communication clarity, and architectural problem-solving after an AI technical session.',
    metrics: [
      { label: 'Technical depth', value: '94', chip: '+6 VS LAST SESSION', progress: 94 },
      { label: 'Communication clarity', value: '89', chip: 'CLEAR RATIONALE', progress: 89 },
      { label: 'Problem solving', value: '92', chip: 'STRUCTURED APPROACH', progress: 92 },
    ],
    steps: [
      { title: 'Review Line-Item Rationale', desc: 'Examine AI feedback citations mapped directly to specific timestamps and answers in your discussion.', tag: 'Detailed Breakdown' },
      { title: 'Convert to Profile Proofs', desc: 'Attach high-scoring problem solving demonstrations directly to your shareable talent passport.', tag: 'Live Signal' },
      { title: 'Execute Targeted Action Items', desc: 'Follow targeted architectural reading recommendations before undertaking real employer interviews.', tag: 'Iterative Polish' }
    ],
    links: [
      { label: 'Start practice session', to: ROUTES.INTERVIEW, icon: 'record_voice_over', desc: 'Launch a new interactive AI interview' },
      { label: 'Open talent cockpit', to: ROUTES.CANDIDATE_OVERVIEW, icon: 'space_dashboard', desc: 'View how reports boost overall scores' },
      { label: 'View career roadmap', to: ROUTES.CANDIDATE_ROADMAP, icon: 'route', desc: 'Check study tasks aligned with report gap analysis' }
    ],
    sandbox: {
      title: 'Replay Session Sentiment & Depth',
      desc: 'Run a simulated diagnostic pass over your response to the distributed rate-limiter design problem to see how scores are generated.',
      btnText: 'Analyze Answer Logic',
      logs: [
        { time: '0.2s', text: 'Parsing speech transcripts for Question 1 (Redis token-bucket limiter)...', type: 'info' },
        { time: '0.5s', text: 'Evaluating tradeoff rationale regarding edge-node replication latency...', type: 'info' },
        { time: '1.0s', text: 'High engineering fluency detected: explicit discussion of thundering-herd prevention.', type: 'highlight' },
        { time: '1.3s', text: '✓ Score awarded: 94/100 Technical Depth with verifiable timestamp proof.', type: 'success' }
      ]
    }
  })
};

// Assign additional specialized modules
Object.assign(productModules, {
  resumeBuilder: createModule({
    role: 'candidate',
    eyebrow: 'Career assets',
    title: 'Transform cryptographic proofs into an interview-ready story.',
    icon: 'description',
    accent: '#00e5ff',
    badge: 'Dynamic Asset Generator',
    description: 'Create a polished, ATS-ready narrative and technical portfolio document synthesized automatically from the strongest verified proofs in your TalentIQ identity.',
    metrics: [
      { label: 'Proofs selected', value: '14', chip: 'HIGH IMPACT', progress: 92 },
      { label: 'ATS parse readiness', value: '100%', chip: 'ZERO REJECTION RISK', progress: 100 },
      { label: 'Featured projects', value: '04', chip: 'VERIFIED REPOS', progress: 85 },
    ],
    steps: [
      { title: 'Filter Relevant Evidence', desc: 'Automatically highlight achievements and repositories most aligned with your target job description.', tag: 'Targeted Polish' },
      { title: 'Synthesize Executive Bio', desc: 'Generate a clean, high-signal profile executive summary backed by verifiable engineering metrics.', tag: 'No Fluff' },
      { title: 'Export Cryptographic Dossier', desc: 'Download an interactive PDF containing embedded verification hashes and repository deep links.', tag: 'Verified PDF' }
    ],
    links: [
      { label: 'View talent identity', to: ROUTES.CANDIDATE_PROFILE, icon: 'fingerprint', desc: 'Review the underlying source proofs' },
      { label: 'Explore job matches', to: ROUTES.CANDIDATE_JOBS, icon: 'work', desc: 'Apply newly tailored assets to high-fit roles' },
      { label: 'Open career roadmap', to: ROUTES.CANDIDATE_ROADMAP, icon: 'route', desc: 'Review remaining technical skill targets' }
    ],
    sandbox: {
      title: 'Simulate ATS Parser Verification',
      desc: 'Test how enterprise Applicant Tracking Systems ingest your customized TalentIQ generated resume without dropping complex repository contributions.',
      btnText: 'Test ATS Ingestion',
      logs: [
        { time: '0.2s', text: 'Simulating ingestion into Workday and Greenhouse parsing pipelines...', type: 'info' },
        { time: '0.6s', text: 'Extracting skills array: Kubernetes, Go, Terraform, Distributed Consensus...', type: 'info' },
        { time: '1.1s', text: 'Zero syntax degradation detected. Verified cryptographic hashes recognized.', type: 'highlight' },
        { time: '1.4s', text: '✓ Candidate ranked in top 2% of incoming applicant pools automatically.', type: 'success' }
      ]
    }
  }),

  jobRecommendations: createModule({
    role: 'candidate',
    eyebrow: 'Opportunity intelligence',
    title: 'High-signal roles matched to your demonstrated strengths.',
    icon: 'work',
    accent: '#10b981',
    badge: 'Pre-Verified Matchmaking',
    description: 'Explore opportunities where hiring managers are explicitly searching for your verified skill graph, GitHub repository footprint, and architectural consistency.',
    metrics: [
      { label: 'Matched roles', value: '24', chip: 'PRE-QUALIFIED', progress: 88 },
      { label: 'Peak match score', value: '97%', chip: 'EXACT FIT', progress: 97 },
      { label: 'New this week', value: '08', chip: 'ACTIVE LEADERS', progress: 75 },
    ],
    steps: [
      { title: 'Examine Role Match Factors', desc: 'Review explicit evidence line items that match your technical background to the team’s requirements.', tag: 'Transparent Fit' },
      { title: 'Prioritize High-Signal Offers', desc: 'Focus on opportunities where your demonstrated proof of work places you in the top 5% of candidates.', tag: 'Strategic Leverage' },
      { title: 'Deploy Verified Dossier', desc: 'Apply in a single click by sharing your cryptographic talent passport directly with the lead recruiter.', tag: '1-Click Apply' }
    ],
    links: [
      { label: 'Build customized resume', to: ROUTES.CANDIDATE_RESUME, icon: 'description', desc: 'Export job-tailored documentation' },
      { label: 'Open talent cockpit', to: ROUTES.CANDIDATE_OVERVIEW, icon: 'space_dashboard', desc: 'Inspect your active competency ratings' },
      { label: 'View career roadmap', to: ROUTES.CANDIDATE_ROADMAP, icon: 'route', desc: 'See how new roles elevate career value' }
    ],
    sandbox: {
      title: 'Test Instant High-Signal Match',
      desc: 'Simulate how your verified Kubernetes operator repository immediately flags your profile to engineering directors at cutting-edge AI labs.',
      btnText: 'Scan Matched Roles',
      logs: [
        { time: '0.3s', text: 'Scanning active requisitions across Tier-1 AI and cloud infrastructure teams...', type: 'info' },
        { time: '0.7s', text: 'Matched against role: Staff Infrastructure Engineer at NeuralScale Labs...', type: 'info' },
        { time: '1.2s', text: 'Your verified custom scheduler PRs exceed required technical confidence thresholds.', type: 'highlight' },
        { time: '1.6s', text: '✓ Opportunity unlocked with pre-verified recommendation priority.', type: 'success' }
      ]
    }
  }),

  teamContributions: createModule({
    role: 'candidate',
    eyebrow: 'Collaboration evidence',
    title: 'Show the leadership behind your commit history.',
    icon: 'groups',
    accent: '#8b5cff',
    badge: 'Graph Collaboration Index',
    description: 'Surface qualitative peer evidence demonstrating technical ownership, code review thoroughness, mentoring impact, and delivery consistency across production repositories.',
    metrics: [
      { label: 'PR reviews tracked', value: '142', chip: 'THOROUGH FEEDBACK', progress: 90 },
      { label: 'Merged feature density', value: '94%', chip: 'HIGH VELOCITY', progress: 94 },
      { label: 'Collaboration index', value: '92.0', chip: 'TECH LEAD SIGNAL', progress: 92 },
    ],
    steps: [
      { title: 'Analyze Code Review Depth', desc: 'Quantify how your constructive PR comments and architectural feedback prevent production regression.', tag: 'Mentorship Metric' },
      { title: 'Map Multi-Team Delivery', desc: 'Visualize how your technical commits interconnect across frontend, backend, and platform repositories.', tag: 'Cross-Functional' },
      { title: 'Attach Collaboration Signal', desc: 'Append peer-verified collaboration proofs directly to your digital talent identity.', tag: 'Leadership Proof' }
    ],
    links: [
      { label: 'Open talent cockpit', to: ROUTES.CANDIDATE_OVERVIEW, icon: 'space_dashboard', desc: 'See collaboration scores in main overview' },
      { label: 'Build your identity', to: ROUTES.CANDIDATE_PROFILE, icon: 'fingerprint', desc: 'Manage connected Git repositories' },
      { label: 'Practice interview', to: ROUTES.INTERVIEW, icon: 'record_voice_over', desc: 'Practice communicating team accomplishments' }
    ],
    sandbox: {
      title: 'Simulate PR Mentorship Scoring',
      desc: 'Run an analysis over your recent architectural suggestions on peer pull requests to compute your verifiable Senior Leadership confidence metric.',
      btnText: 'Evaluate Collaboration',
      logs: [
        { time: '0.3s', text: 'Analyzing 48 pull request reviews across core team microservices...', type: 'info' },
        { time: '0.7s', text: 'Identifying constructive architectural guidance and test coverage enforcement...', type: 'info' },
        { time: '1.2s', text: 'High Mentorship Signal detected: your reviews reduced rollback rates by 42%.', type: 'highlight' },
        { time: '1.5s', text: '✓ Collaboration index elevated to 92/100 (Senior Tech Lead standing).', type: 'success' }
      ]
    }
  }),

  presentations: createModule({
    role: 'candidate',
    eyebrow: 'Presentation intelligence',
    title: 'Make every engineering architecture pitch undeniable.',
    icon: 'slideshow',
    accent: '#ffd54f',
    badge: 'Multi-Modal Pitch Analysis',
    description: 'Evaluate technical presentations and RFC recordings through AI models tracking clarity of rationale, system diagram comprehensibility, and feasibility signals.',
    metrics: [
      { label: 'Architecture clarity', value: '92', chip: 'CRYSTAL CLEAR', progress: 92 },
      { label: 'Feasibility score', value: '96', chip: 'PRODUCTION READY', progress: 96 },
      { label: 'Innovation signal', value: '89', chip: 'FORWARD THINKING', progress: 89 },
    ],
    steps: [
      { title: 'Upload Presentation Deck', desc: 'Upload system design slide decks, RFC documents, or conference presentation videos.', tag: 'Multi-Modal Input' },
      { title: 'Review Diagnostic Telemetry', desc: 'Receive detailed AI line-item assessments evaluating structure, technical precision, and persuasive weight.', tag: 'Diagnostic Review' },
      { title: 'Link to Project Proofs', desc: 'Attach verified presentation achievements to corresponding repository proof points in your dossier.', tag: 'Holistic Evidence' }
    ],
    links: [
      { label: 'View talent identity', to: ROUTES.CANDIDATE_PROFILE, icon: 'fingerprint', desc: 'See attached presentation proofs' },
      { label: 'Track hackathon work', to: ROUTES.HACKATHONS, icon: 'emoji_events', desc: 'Link presentations to hackathon victories' },
      { label: 'Open featured dossier', to: ROUTES.TALENT_REPORT('elena-rodriguez'), icon: 'description', desc: 'See how Elena presents tech case studies' }
    ],
    sandbox: {
      title: 'Analyze RFC Deck Structure',
      desc: 'Simulate an AI evaluation pass over a 12-slide Kafka clustering architecture presentation to assess technical conciseness and risk mitigation clarity.',
      btnText: 'Evaluate Architecture Deck',
      logs: [
        { time: '0.2s', text: 'Extracting text diagrams and architecture schemas from PDF slides...', type: 'info' },
        { time: '0.6s', text: 'Evaluating network segmentation diagrams and backup rollback logic...', type: 'info' },
        { time: '1.1s', text: 'High architectural clarity identified: explicit capacity math provided on slide 8.', type: 'highlight' },
        { time: '1.4s', text: '✓ Presentation intelligence badge verified with 92% executive clarity rating.', type: 'success' }
      ]
    }
  }),

  hackathons: createModule({
    role: 'recruiter',
    eyebrow: 'Hackathon-to-hiring',
    title: 'Turn elite hackathon delivery into immediate hiring momentum.',
    icon: 'emoji_events',
    accent: '#ffd54f',
    badge: 'High-Velocity Builder Network',
    description: 'Identify top-performing engineering teams and solo builders by evaluating live hackathon code execution, time-to-delivery velocity, and innovation signal.',
    metrics: [
      { label: 'Active events tracked', value: '14', chip: 'LIVE WEB3 & AI', progress: 85 },
      { label: 'Top 1% builders', value: '48', chip: 'INSTANT SIGNAL', progress: 95 },
      { label: 'Repositories verified', value: '280', chip: 'AUTOMATED REVIEW', progress: 90 },
    ],
    steps: [
      { title: 'Monitor Live Events', desc: 'Track high-stakes engineering hackathons and competitive AI build-offs in real time.', tag: 'Live Telemetry' },
      { title: 'Evaluate Under-Pressure Code', desc: 'Assess clean code practices, algorithmic creativity, and delivery speed under extreme constraints.', tag: 'Rapid Execution' },
      { title: 'Engage Winners Instantly', desc: 'Move standout builders directly into specialized recruiter pipelines with pre-populated proofs.', tag: 'First-Mover Edge' }
    ],
    links: [
      { label: 'Search talent', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'Filter candidates by hackathon trophies' },
      { label: 'Open pipeline', to: ROUTES.RECRUITER_PIPELINE, icon: 'account_tree', desc: 'Move builders into interview stages' },
      { label: 'Explore matching', to: ROUTES.MATCHING, icon: 'hub', desc: 'Match project innovations against team stacks' }
    ],
    sandbox: {
      title: 'Scan Hackathon Leaderboard',
      desc: 'Simulate a real-time scan across 64 AI hackathon repositories to identify the single team that implemented custom CUDA memory optimization under 24 hours.',
      btnText: 'Scan Live Build-off',
      logs: [
        { time: '0.3s', text: 'Connecting to live commit feeds from Autonomous Agent Build-off 2026...', type: 'info' },
        { time: '0.7s', text: 'Analyzing 64 submitted repositories for code novelty and memory efficiency...', type: 'info' },
        { time: '1.3s', text: 'Team "NeuralZero" deployed custom fused Kernel reducing latency by 4.2x!', type: 'highlight' },
        { time: '1.7s', text: '✓ 3 top-tier builders automatically surfaced to priority hiring shortlist.', type: 'success' }
      ]
    }
  }),

  trustFraud: createModule({
    role: 'recruiter',
    eyebrow: 'Trust & Risk Governance',
    title: 'Institutional-grade verification before every decision.',
    icon: 'shield',
    accent: '#00e5ff',
    badge: 'Zero-Fraud Assurance Engine',
    description: 'Consolidate identity cryptographic proofs, repository PGP signature checks, anti-plagiarism algorithms, and AI syntax attribution into an unbreakable risk radar.',
    metrics: [
      { label: 'Authenticity score', value: '99.8%', chip: 'CRYPTO VERIFIED', progress: 100 },
      { label: 'Plagiarism checks', value: 'Zero Risk', chip: 'DEEP CODE SCAN', progress: 98 },
      { label: 'Audit readiness', value: 'Class A', chip: 'INSTITUTIONAL', progress: 95 },
    ],
    steps: [
      { title: 'Verify PGP Commit Chains', desc: 'Trace important repository commits back to verified SSH/PGP keys to eliminate identity spoofing.', tag: 'Cryptographic Auth' },
      { title: 'Detect AI-Generated Padding', desc: 'Highlight shallow AI-generated boilerplate versus deep human systems problem solving.', tag: 'Quality Defense' },
      { title: 'Generate Audit Defensibility', desc: 'Attach permanent verification stamps and risk reports to every candidate hiring recommendation.', tag: 'Total Defensibility' }
    ],
    links: [
      { label: 'Open verification engine', to: ROUTES.VERIFICATION, icon: 'verified_user', desc: 'Review underlying verification algorithms' },
      { label: 'Search talent', to: ROUTES.RECRUITER_SEARCH, icon: 'travel_explore', desc: 'Browse verified zero-risk profiles' },
      { label: 'View featured dossier', to: ROUTES.TALENT_REPORT('elena-rodriguez'), icon: 'description', desc: 'Examine complete trust audit trail' }
    ],
    sandbox: {
      title: 'Run Cryptographic Audit',
      desc: 'Trigger a deep cryptographic and anti-plagiarism investigation across a candidate’s historical contributions to guarantee absolute hiring security.',
      btnText: 'Run Trust Audit',
      logs: [
        { time: '0.2s', text: 'Initiating PGP commit signature validation across 18 public repositories...', type: 'info' },
        { time: '0.6s', text: 'Cross-referencing AST structure against known tutorial boilerplate databases...', type: 'info' },
        { time: '1.1s', text: 'Zero duplicate AST vectors found. Authentic architecture originality verified.', type: 'highlight' },
        { time: '1.5s', text: '✓ Institutional Trust Certificate generated: Risk Level rated minimal (0.2%).', type: 'success' }
      ]
    }
  })
});
