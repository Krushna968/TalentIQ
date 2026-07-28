import { Request, Response } from 'express';

export const verifyGithub = async (req: Request, res: Response) => {
  res.json({ status: 'verified', score: 92, details: { repos: 45, stars: 1200, contributions: 340 } });
};

export const verifyCertification = async (req: Request, res: Response) => {
  res.json({ status: 'verified', score: 88, details: { provider: 'AWS', credential: 'AWS Certified Developer', verifiedAt: new Date() } });
};

export const verifyHackathon = async (req: Request, res: Response) => {
  res.json({ status: 'verified', score: 85, details: { event: 'HackIndia 2023', rank: 'Runner-up', teamSize: 4 } });
};

export const verifyPresentation = async (req: Request, res: Response) => {
  res.json({ status: 'verified', score: 78, details: { event: 'ReactConf India 2023', type: 'Lightning Talk', duration: 15 } });
};

export const getVerificationStatus = async (req: Request, res: Response) => {
  res.json({ id: req.params.id, status: 'verified', overallScore: 86 });
};

export const getBadges = async (_req: Request, res: Response) => {
  res.json({ badges: [
    { id: 'b1', label: 'GitHub Verified', type: 'github', issuedAt: new Date() },
    { id: 'b2', label: 'AWS Certified', type: 'certification', issuedAt: new Date() },
    { id: 'b3', label: 'Hackathon Champion', type: 'hackathon', issuedAt: new Date() },
  ]});
};
