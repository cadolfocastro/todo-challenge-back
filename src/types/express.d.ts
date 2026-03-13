// Extends Express.Request with the authenticated user injected by auth.middleware
declare namespace Express {
  interface Request {
    user?: {
      uid: string;
      email: string;
    };
  }
}
