import { Request, Response, NextFunction } from 'express';

export interface AsyncController {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface TokenPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
