jest.mock('../../../infrastructure/repositories/firebase-auth.repository');
jest.mock('../../../infrastructure/repositories/firestore-user.repository');

import { Request, Response } from 'express';
import { AuthController } from '../../../presentation/controllers/auth.controller';
import { FirebaseAuthRepository } from '../../../infrastructure/repositories/firebase-auth.repository';
import { FirestoreUserRepository } from '../../../infrastructure/repositories/firestore-user.repository';

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;
  let mockSignIn: jest.Mock;
  let mockRegister: jest.Mock;
  let mockUserCreate: jest.Mock;

  beforeEach(() => {
    mockSignIn = jest.fn();
    mockRegister = jest.fn();
    mockUserCreate = jest.fn();

    (FirebaseAuthRepository as jest.Mock).mockImplementation(() => ({
      verifyToken: jest.fn(),
      signIn: mockSignIn,
      register: mockRegister,
    }));

    (FirestoreUserRepository as jest.Mock).mockImplementation(() => ({
      create: mockUserCreate,
      getByUid: jest.fn(),
    }));

    controller = new AuthController();
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('responds 200 with uid, email, token on valid credentials', async () => {
      // Arrange
      const req = {
        body: { email: 'a@b.com', password: 'pass' },
      } as Request;
      const res = mockRes();
      mockSignIn.mockResolvedValue({ uid: 'u1', email: 'a@b.com', token: 'tok' });

      // Act
      await controller.login(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ uid: 'u1', email: 'a@b.com', token: 'tok' });
    });

    it('responds 401 with error body when credentials are invalid', async () => {
      // Arrange
      const req = { body: { email: 'a@b.com', password: 'wrong' } } as Request;
      const res = mockRes();
      mockSignIn.mockRejectedValue(new Error('INVALID_LOGIN_CREDENTIALS'));

      // Act
      await controller.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'INVALID_LOGIN_CREDENTIALS' },
      });
    });

    it('responds 401 for EMAIL_NOT_FOUND error', async () => {
      // Arrange
      const req = { body: { email: 'x@b.com', password: 'p' } } as Request;
      const res = mockRes();
      mockSignIn.mockRejectedValue(new Error('EMAIL_NOT_FOUND'));

      // Act
      await controller.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: { message: 'EMAIL_NOT_FOUND' } });
    });

    it('responds 401 for INVALID_PASSWORD error', async () => {
      // Arrange
      const req = { body: { email: 'a@b.com', password: 'wrong' } } as Request;
      const res = mockRes();
      mockSignIn.mockRejectedValue(new Error('INVALID_PASSWORD'));

      // Act
      await controller.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('responds 500 for unexpected errors', async () => {
      // Arrange
      const req = { body: { email: 'a@b.com', password: 'p' } } as Request;
      const res = mockRes();
      mockSignIn.mockRejectedValue(new Error('INTERNAL_ERROR'));

      // Act
      await controller.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: { message: 'INTERNAL_ERROR' } });
    });

    it('uses UNKNOWN as error code when error is not an Error instance', async () => {
      // Arrange
      const req = { body: { email: 'a@b.com', password: 'p' } } as Request;
      const res = mockRes();
      mockSignIn.mockRejectedValue('string error');

      // Act
      await controller.login(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ error: { message: 'UNKNOWN' } });
    });
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('responds 201 with uid, email, token on successful registration', async () => {
      // Arrange
      const req = { body: { email: 'new@b.com', password: 'pass123' } } as Request;
      const res = mockRes();
      mockRegister.mockResolvedValue({ uid: 'u2', email: 'new@b.com', token: 'tok2' });
      mockUserCreate.mockResolvedValue({
        uid: 'u2',
        email: 'new@b.com',
        createdAt: new Date(),
      });

      // Act
      await controller.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ uid: 'u2', email: 'new@b.com', token: 'tok2' });
    });

    it('responds 409 when email already exists', async () => {
      // Arrange
      const req = { body: { email: 'existing@b.com', password: 'pass' } } as Request;
      const res = mockRes();
      mockRegister.mockRejectedValue(new Error('EMAIL_EXISTS'));

      // Act
      await controller.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('correo') }),
      );
    });

    it('responds 500 for unexpected registration errors', async () => {
      // Arrange
      const req = { body: { email: 'a@b.com', password: 'pass' } } as Request;
      const res = mockRes();
      mockRegister.mockRejectedValue(new Error('NETWORK_ERROR'));

      // Act
      await controller.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('responds 500 when error is not an Error instance', async () => {
      // Arrange
      const req = { body: { email: 'a@b.com', password: 'pass' } } as Request;
      const res = mockRes();
      mockRegister.mockRejectedValue('unknown failure');

      // Act
      await controller.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
