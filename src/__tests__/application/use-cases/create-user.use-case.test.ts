import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';

const makeAuthRepo = (): jest.Mocked<IAuthRepository> => ({
  verifyToken: jest.fn(),
  signIn: jest.fn(),
  register: jest.fn(),
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  create: jest.fn(),
  getByUid: jest.fn(),
});

describe('CreateUserUseCase', () => {
  let authRepo: jest.Mocked<IAuthRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    authRepo = makeAuthRepo();
    userRepo = makeUserRepo();
    useCase = new CreateUserUseCase(authRepo, userRepo);
  });

  describe('execute', () => {
    it('registers the user in auth, persists to Firestore, and returns uid/email/token', async () => {
      // Arrange
      const authResult = { uid: 'u1', email: 'a@b.com', token: 'tok' };
      authRepo.register.mockResolvedValue(authResult);
      userRepo.create.mockResolvedValue({ uid: 'u1', email: 'a@b.com', createdAt: new Date() });

      // Act
      const result = await useCase.execute({ email: 'a@b.com', password: 'pass123' });

      // Assert
      expect(authRepo.register).toHaveBeenCalledWith('a@b.com', 'pass123');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'u1', email: 'a@b.com' }),
      );
      expect(result).toEqual({ uid: 'u1', email: 'a@b.com', token: 'tok' });
    });

    it('persists user with a Date as createdAt', async () => {
      // Arrange
      authRepo.register.mockResolvedValue({ uid: 'u1', email: 'a@b.com', token: 't' });
      userRepo.create.mockResolvedValue({ uid: 'u1', email: 'a@b.com', createdAt: new Date() });

      // Act
      await useCase.execute({ email: 'a@b.com', password: 'pass123' });

      // Assert
      const stored = userRepo.create.mock.calls[0][0];
      expect(stored.createdAt).toBeInstanceOf(Date);
    });

    it('does not persist to Firestore if auth registration fails', async () => {
      // Arrange
      authRepo.register.mockRejectedValue(new Error('EMAIL_EXISTS'));

      // Act & Assert
      await expect(
        useCase.execute({ email: 'a@b.com', password: 'pass' }),
      ).rejects.toThrow('EMAIL_EXISTS');
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('propagates Firestore error when user persistence fails', async () => {
      // Arrange
      authRepo.register.mockResolvedValue({ uid: 'u1', email: 'a@b.com', token: 'tok' });
      userRepo.create.mockRejectedValue(new Error('Firestore write failed'));

      // Act & Assert
      await expect(
        useCase.execute({ email: 'a@b.com', password: 'pass' }),
      ).rejects.toThrow('Firestore write failed');
    });
  });
});
