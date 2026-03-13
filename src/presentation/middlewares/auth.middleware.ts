import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../../infrastructure/firebase/firebase.config';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: missing or malformed token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email ?? '' };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
};
