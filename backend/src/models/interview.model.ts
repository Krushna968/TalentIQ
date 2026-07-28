export interface IInterviewSession {
  id: string;
  userId: string;
  type: 'technical' | 'behavioral' | 'system_design';
  status: 'in_progress' | 'completed';
  questions: IInterviewQuestion[];
  scores: IInterviewScores;
  startedAt: Date;
  completedAt?: Date;
}

export interface IInterviewQuestion {
  id: string;
  question: string;
  category: string;
  userAnswer?: string;
  aiFeedback?: string;
  score?: number;
}

export interface IInterviewScores {
  technicalAccuracy: number;
  communication: number;
  problemSolving: number;
  overall: number;
}
