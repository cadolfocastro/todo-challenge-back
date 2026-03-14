import { Request, Response } from 'express';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { FirebaseAuthRepository } from '../../infrastructure/repositories/firebase-auth.repository';
import { FirestoreUserRepository } from '../../infrastructure/repositories/firestore-user.repository';

export class AuthController {
  private readonly loginUserUseCase: LoginUserUseCase;
  private readonly createUserUseCase: CreateUserUseCase;

  constructor() {
    const authRepository = new FirebaseAuthRepository();
    this.loginUserUseCase = new LoginUserUseCase(authRepository);
    this.createUserUseCase = new CreateUserUseCase(authRepository, new FirestoreUserRepository());
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };

    try {
      const result = await this.loginUserUseCase.execute({ email, password });
      res.json(result);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      const status = code === 'INVALID_PASSWORD' || code === 'EMAIL_NOT_FOUND' || code === 'INVALID_LOGIN_CREDENTIALS' ? 401 : 500;
      res.status(status).json({ error: { message: code } });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };

    try {
      const result = await this.createUserUseCase.execute({ email, password });
      res.status(201).json(result);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'EMAIL_EXISTS') {
        res.status(409).json({ message: 'El correo ya está registrado' });
        return;
      }
      res.status(500).json({ message: 'Error al crear el usuario' });
    }
  }
}
