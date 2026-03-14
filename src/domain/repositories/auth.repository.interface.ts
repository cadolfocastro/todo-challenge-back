export interface AuthTokenResult {
  uid: string;
  email: string;
  token: string;
}

export interface IAuthRepository {
  verifyToken(token: string): Promise<{ uid: string; email: string }>;
  signIn(email: string, password: string): Promise<AuthTokenResult>;
  register(email: string, password: string): Promise<AuthTokenResult>;
}
