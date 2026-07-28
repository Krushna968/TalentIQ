export interface IVerificationRequest {
  id: string;
  userId: string;
  type: 'github' | 'certification' | 'hackathon' | 'presentation';
  status: 'pending' | 'in_progress' | 'verified' | 'rejected';
  evidence: string;
  score: number;
  submittedAt: Date;
  resolvedAt?: Date;
}

export interface IBadge {
  id: string;
  userId: string;
  type: string;
  label: string;
  issuedAt: Date;
  expiresAt?: Date;
}
