import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';

const makeAuthRepo = (): jest.Mocked<IAuthRepository> => ({
  verifyToken: jest.fn(),
  signIn: jest.fn(),
  register: jest.fn(),
});

describe('LoginUserUseCase', () => {
  let authRepo: jest.Mocked<IAuthRepository>;
  let useCase: LoginUserUseCase;

  beforeEach(() => {
    authRepo = makeAuthRepo();
    useCase = new LoginUserUseCase(authRepo);
  });

  describe('execute', () => {
    it('returns uid, email and token on successful sign-in', async () => {
      // Arrange
      const expected = { uid: 'u1', email: 'user@test.com', token: 'id-token' };
      authRepo.signIn.mockResolvedValue(expected);

      // Act
      const result = await useCase.execute({ email: 'user@test.com', password: 'pass123' });

      // Assert
      expect(authRepo.signIn).toHaveBeenCalledWith('user@test.com', 'pass123');
      expect(result).toEqual(expected);
    });

    it('forwards email and password correctly to the repository', async () => {
      // Arrange
      authRepo.signIn.mockResolvedValue({ uid: 'u1', email: 'a@b.com', token: 't' });

      // Act
      await useCase.execute({ email: 'a@b.com', password: 'secret' });

      // Assert
      expect(authRepo.signIn).toHaveBeenCalledWith('a@b.com', 'secret');
    });

    it('propagates INVALID_LOGIN_CREDENTIALS error from auth repository', async () => {
      // Arrange
      authRepo.signIn.mockRejectedValue(new Error('INVALID_LOGIN_CREDENTIALS'));

      // Act & Assert
      await expect(
        useCase.execute({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow('INVALID_LOGIN_CREDENTIALS');
    });

    it('propagates EMAIL_NOT_FOUND error from auth repository', async () => {
      // Arrange
      authRepo.signIn.mockRejectedValue(new Error('EMAIL_NOT_FOUND'));

      // Act & Assert
      await expect(
        useCase.execute({ email: 'missing@b.com', password: 'pass' }),
      ).rejects.toThrow('EMAIL_NOT_FOUND');
    });
  });
});
