export interface IAuthService {
  verifyToken(token: string): Promise<{ uid: string; email: string }>;
}
