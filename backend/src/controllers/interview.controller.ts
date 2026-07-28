import { Request, Response } from 'express';

export const getQuestions = async (_req: Request, res: Response) => {
  res.json({ questions: [
    { id: 'q1', question: 'Design a rate-limiting system for a distributed API gateway.', category: 'System Design' },
    { id: 'q2', question: 'Explain how you would implement a feature store for ML models.', category: 'ML Engineering' },
    { id: 'q3', question: 'Walk through your approach to debugging a production outage.', category: 'Problem Solving' },
    { id: 'q4', question: 'How would you optimize a slow GraphQL resolver chain?', category: 'Performance' },
    { id: 'q5', question: 'Describe the trade-offs between microservices and monoliths.', category: 'Architecture' },
  ]});
};

export const submitAnswer = async (req: Request, res: Response) => {
  res.json({ score: Math.floor(Math.random() * 30) + 70, feedback: 'Strong answer. Consider discussing trade-offs more explicitly.', nextQuestion: 'q2' });
};

export const getSessions = async (_req: Request, res: Response) => {
  res.json({ sessions: [
    { id: 's1', type: 'technical', status: 'completed', score: 86, date: new Date() },
    { id: 's2', type: 'behavioral', status: 'in_progress', score: null, date: new Date() },
  ]});
};

export const getSession = async (req: Request, res: Response) => {
  res.json({ id: req.params.id, type: 'technical', status: 'completed', questions: [
    { id: 'q1', question: 'Design a rate-limiting system...', score: 88, feedback: 'Good system design approach.' },
    { id: 'q2', question: 'Explain a feature store...', score: 84, feedback: 'Solid understanding.' },
  ], overallScore: 86 });
};

export const getInterviewReport = async (req: Request, res: Response) => {
  res.json({ sessionId: req.params.sessionId, scores: { technicalAccuracy: 85, communication: 78, problemSolving: 92, overall: 86 }, strengths: ['System design', 'Problem decomposition'], improvements: ['Communication clarity'] });
};
