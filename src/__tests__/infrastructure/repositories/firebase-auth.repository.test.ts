jest.mock('../../../infrastructure/firebase/firebase.config', () => ({
  firebaseAuth: { verifyIdToken: jest.fn() },
  db: {},
}));

import { FirebaseAuthRepository } from '../../../infrastructure/repositories/firebase-auth.repository';
import { firebaseAuth } from '../../../infrastructure/firebase/firebase.config';

const mockVerifyIdToken = firebaseAuth.verifyIdToken as jest.Mock;

// Mock global fetch (available in Node 20+)
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const makeSuccessResponse = (body: object) =>
  ({
    ok: true,
    json: () => Promise.resolve(body),
  }) as Response;

const makeErrorResponse = (body: object, status = 400) =>
  ({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }) as Response;

describe('FirebaseAuthRepository', () => {
  let repo: FirebaseAuthRepository;

  beforeEach(() => {
    repo = new FirebaseAuthRepository();
    jest.clearAllMocks();
  });

  // ─── verifyToken ────────────────────────────────────────────────────────────

  describe('verifyToken', () => {
    it('returns uid and email from a decoded token', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com' });

      // Act
      const result = await repo.verifyToken('some-token');

      // Assert
      expect(mockVerifyIdToken).toHaveBeenCalledWith('some-token');
      expect(result).toEqual({ uid: 'u1', email: 'a@b.com' });
    });

    it('defaults email to empty string when not present in token', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue({ uid: 'u1', email: undefined });

      // Act
      const result = await repo.verifyToken('some-token');

      // Assert
      expect(result.email).toBe('');
    });

    it('propagates errors thrown by firebaseAuth.verifyIdToken', async () => {
      // Arrange
      mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

      // Act & Assert
      await expect(repo.verifyToken('expired')).rejects.toThrow('Token expired');
    });
  });

  // ─── signIn ─────────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('calls Firebase REST signInWithPassword and returns uid/email/token', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        makeSuccessResponse({ localId: 'u1', email: 'a@b.com', idToken: 'id-tok' }),
      );

      // Act
      const result = await repo.signIn('a@b.com', 'pass123');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('accounts:signInWithPassword'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ uid: 'u1', email: 'a@b.com', token: 'id-tok' });
    });

    it('sends returnSecureToken: true in the request body', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        makeSuccessResponse({ localId: 'u1', email: 'a@b.com', idToken: 't' }),
      );

      // Act
      await repo.signIn('a@b.com', 'pass');

      // Assert
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.returnSecureToken).toBe(true);
      expect(body.email).toBe('a@b.com');
      expect(body.password).toBe('pass');
    });

    it('throws an error with the Firebase error code on failed sign-in', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        makeErrorResponse({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }),
      );

      // Act & Assert
      await expect(repo.signIn('a@b.com', 'wrong')).rejects.toThrow(
        'INVALID_LOGIN_CREDENTIALS',
      );
    });

    it('throws UNKNOWN when error response has no message', async () => {
      // Arrange
      mockFetch.mockResolvedValue(makeErrorResponse({ error: {} }));

      // Act & Assert
      await expect(repo.signIn('a@b.com', 'pass')).rejects.toThrow('UNKNOWN');
    });
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('calls Firebase REST signUp and returns uid/email/token', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        makeSuccessResponse({ localId: 'u2', email: 'new@b.com', idToken: 'new-tok' }),
      );

      // Act
      const result = await repo.register('new@b.com', 'pass123');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('accounts:signUp'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ uid: 'u2', email: 'new@b.com', token: 'new-tok' });
    });

    it('throws an error with the Firebase error code on failed registration', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        makeErrorResponse({ error: { message: 'EMAIL_EXISTS' } }),
      );

      // Act & Assert
      await expect(repo.register('existing@b.com', 'pass')).rejects.toThrow('EMAIL_EXISTS');
    });

    it('error object has the code property set', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        makeErrorResponse({ error: { message: 'EMAIL_EXISTS' } }),
      );

      // Act
      let thrown: unknown;
      try {
        await repo.register('existing@b.com', 'pass');
      } catch (e) {
        thrown = e;
      }

      // Assert
      expect((thrown as Error & { code: string }).code).toBe('EMAIL_EXISTS');
    });
  });
});
