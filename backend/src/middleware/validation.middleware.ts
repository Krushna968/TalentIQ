import { Request, Response, NextFunction } from 'express';

export const validate = (schema: string) => {
  return (req: Request, res: Response, next: NextFunction) => {};
};
