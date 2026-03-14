import { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface CreateUserResultDto {
  uid: string;
  email: string;
  token: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<CreateUserResultDto> {
    const { uid, email, token } = await this.authRepository.register(dto.email, dto.password);

    await this.userRepository.create({ uid, email, createdAt: new Date() });

    return { uid, email, token };
  }
}
