import { Request, Response, NextFunction } from 'express';

export const validate = (_schema: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
