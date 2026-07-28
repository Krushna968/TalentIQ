import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {};
};
