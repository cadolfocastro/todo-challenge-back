import { Request, Response } from 'express';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { FirebaseAuthService } from '../../infrastructure/services/firebase-auth.service';

export class AuthController {
  private readonly loginUserUseCase: LoginUserUseCase;

  constructor() {
    this.loginUserUseCase = new LoginUserUseCase(new FirebaseAuthService());
  }

  async login(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      res.status(400).json({ message: 'El campo "idToken" es obligatorio' });
      return;
    }

    try {
      const result = await this.loginUserUseCase.execute(idToken);
      res.json(result);
    } catch {
      res.status(401).json({ message: 'Token inválido o expirado' });
    }
  }
}
