import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResultDto {
  uid: string;
  email: string;
  token: string;
}

export class LoginUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: LoginDto): Promise<LoginResultDto> {
    return this.authRepository.signIn(dto.email, dto.password);
  }
}
