// Must mock the repository module before it is imported by auth.middleware
jest.mock('../../../infrastructure/repositories/firebase-auth.repository', () => ({
  FirebaseAuthRepository: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn(),
    signIn: jest.fn(),
    register: jest.fn(),
  })),
}));

import { Request, Response, NextFunction } from 'express';
import { FirebaseAuthRepository } from '../../../infrastructure/repositories/firebase-auth.repository';
import { authMiddleware } from '../../../presentation/middlewares/auth.middleware';

// The middleware creates one module-level instance; grab it after all imports settle
const getRepoInstance = () =>
  (FirebaseAuthRepository as jest.Mock).mock.results[0].value as {
    verifyToken: jest.Mock;
  };

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

beforeEach(() => {
  getRepoInstance().verifyToken.mockReset();
  mockNext.mockReset();
});

describe('authMiddleware', () => {
  it('sets req.user and calls next() for a valid Bearer token', async () => {
    // Arrange
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as Request;
    const res = mockRes();
    getRepoInstance().verifyToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com' });

    // Act
    await authMiddleware(req, res, mockNext);

    // Assert
    expect(getRepoInstance().verifyToken).toHaveBeenCalledWith('valid-token');
    expect((req as any).user).toEqual({ uid: 'u1', email: 'a@b.com' });
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when Authorization header is absent', async () => {
    // Arrange
    const req = { headers: {} } as unknown as Request;
    const res = mockRes();

    // Act
    await authMiddleware(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('missing') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    // Arrange
    const req = {
      headers: { authorization: 'Basic sometoken' },
    } as unknown as Request;
    const res = mockRes();

    // Act
    await authMiddleware(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', async () => {
    // Arrange
    const req = {
      headers: { authorization: 'Bearer expired-token' },
    } as unknown as Request;
    const res = mockRes();
    getRepoInstance().verifyToken.mockRejectedValue(new Error('Token expired'));

    // Act
    await authMiddleware(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('invalid') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('does not call verifyToken when header is malformed', async () => {
    // Arrange
    const req = { headers: { authorization: 'BearerNoSpace' } } as unknown as Request;
    const res = mockRes();

    // Act
    await authMiddleware(req, res, mockNext);

    // Assert
    expect(getRepoInstance().verifyToken).not.toHaveBeenCalled();
  });
});
