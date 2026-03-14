import { Request, Response, NextFunction } from 'express';
import {
  validateLogin,
  validateRegister,
  validateCreateTask,
  validateUpdateTask,
} from '../../../presentation/middlewares/validation.middleware';

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

beforeEach(() => jest.clearAllMocks());

// ─── validateLogin ───────────────────────────────────────────────────────────

describe('validateLogin', () => {
  it('calls next() when email and password are valid', () => {
    // Arrange
    const req = { body: { email: 'user@test.com', password: 'secret' } } as Request;
    const res = mockRes();

    // Act
    validateLogin(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 when email is absent', () => {
    // Arrange
    const req = { body: { password: 'secret' } } as Request;
    const res = mockRes();

    // Act
    validateLogin(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('email') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid email format', () => {
    // Arrange
    const req = { body: { email: 'not-an-email', password: 'secret' } } as Request;
    const res = mockRes();

    // Act
    validateLogin(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 when password is absent', () => {
    // Arrange
    const req = { body: { email: 'user@test.com' } } as Request;
    const res = mockRes();

    // Act
    validateLogin(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('password') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 when body is empty', () => {
    // Arrange
    const req = { body: {} } as Request;
    const res = mockRes();

    // Act
    validateLogin(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── validateRegister ────────────────────────────────────────────────────────

describe('validateRegister', () => {
  it('calls next() for a valid email and password of 6+ characters', () => {
    // Arrange
    const req = { body: { email: 'user@test.com', password: 'pass12' } } as Request;
    const res = mockRes();

    // Act
    validateRegister(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when password is shorter than 6 characters', () => {
    // Arrange
    const req = { body: { email: 'user@test.com', password: '123' } } as Request;
    const res = mockRes();

    // Act
    validateRegister(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('6') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 when password is exactly 5 characters (boundary)', () => {
    // Arrange
    const req = { body: { email: 'user@test.com', password: '12345' } } as Request;
    const res = mockRes();

    // Act
    validateRegister(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('accepts a password of exactly 6 characters (boundary)', () => {
    // Arrange
    const req = { body: { email: 'user@test.com', password: '123456' } } as Request;
    const res = mockRes();

    // Act
    validateRegister(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for an invalid email format', () => {
    // Arrange
    const req = { body: { email: 'bad', password: 'pass123' } } as Request;
    const res = mockRes();

    // Act
    validateRegister(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when email is absent', () => {
    // Arrange
    const req = { body: { password: 'pass123' } } as Request;
    const res = mockRes();

    // Act
    validateRegister(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ─── validateCreateTask ──────────────────────────────────────────────────────

describe('validateCreateTask', () => {
  it('calls next() when title is provided', () => {
    // Arrange
    const req = { body: { title: 'My task' } } as Request;
    const res = mockRes();

    // Act
    validateCreateTask(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when title is absent', () => {
    // Arrange
    const req = { body: {} } as Request;
    const res = mockRes();

    // Act
    validateCreateTask(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('title') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 for a whitespace-only title', () => {
    // Arrange
    const req = { body: { title: '   ' } } as Request;
    const res = mockRes();

    // Act
    validateCreateTask(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ─── validateUpdateTask ──────────────────────────────────────────────────────

describe('validateUpdateTask', () => {
  it('calls next() for a valid status and priority', () => {
    // Arrange
    const req = { body: { status: 'todo', priority: 'Alta' } } as Request;
    const res = mockRes();

    // Act
    validateUpdateTask(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('calls next() when body has no status or priority fields', () => {
    // Arrange
    const req = { body: { title: 'New title' } } as Request;
    const res = mockRes();

    // Act
    validateUpdateTask(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for an unrecognised status value', () => {
    // Arrange
    const req = { body: { status: 'invalid-status' } } as Request;
    const res = mockRes();

    // Act
    validateUpdateTask(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('status') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 for an unrecognised priority value', () => {
    // Arrange
    const req = { body: { priority: 'Critica' } } as Request;
    const res = mockRes();

    // Act
    validateUpdateTask(req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('priority') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('accepts all valid status values', () => {
    // Arrange
    const statuses = ['todo', 'inProgress', 'done'];

    statuses.forEach((status) => {
      const req = { body: { status } } as Request;
      const res = mockRes();

      // Act
      validateUpdateTask(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      jest.clearAllMocks();
    });
  });

  it('accepts all valid priority values', () => {
    // Arrange
    const priorities = ['Baja', 'Media', 'Alta'];

    priorities.forEach((priority) => {
      const req = { body: { priority } } as Request;
      const res = mockRes();

      // Act
      validateUpdateTask(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      jest.clearAllMocks();
    });
  });
});
