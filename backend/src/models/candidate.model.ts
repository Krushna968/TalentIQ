export interface ICandidate {
  id: string;
  userId: string;
  talentScore: number;
  skills: ISkill[];
  verifiedSignals: IVerifiedSignal[];
  githubUsername?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  pipelineStatus: 'discovered' | 'screened' | 'interviewing' | 'offered' | 'hired' | 'rejected';
}

export interface ISkill {
  name: string;
  category: string;
  score: number;
  verified: boolean;
}

export interface IVerifiedSignal {
  type: 'github' | 'certification' | 'hackathon' | 'presentation' | 'opensource' | 'social';
  title: string;
  source: string;
  verifiedAt: Date;
  evidenceUrl?: string;
}
