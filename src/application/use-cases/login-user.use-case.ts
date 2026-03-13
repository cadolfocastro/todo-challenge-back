import { IAuthService } from '../../domain/services/auth.service.interface';

export interface LoginResultDto {
  uid: string;
  email: string;
  token: string;
}

export class LoginUserUseCase {
  constructor(private readonly authService: IAuthService) {}

  async execute(idToken: string): Promise<LoginResultDto> {
    const user = await this.authService.verifyToken(idToken);
    return { uid: user.uid, email: user.email, token: idToken };
  }
}
