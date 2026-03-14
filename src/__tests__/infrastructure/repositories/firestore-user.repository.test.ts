jest.mock('../../../infrastructure/firebase/firebase.config', () => ({
  db: { collection: jest.fn() },
  firebaseAuth: {},
}));

jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      fromDate: jest.fn((date: Date) => ({ _date: date, toDate: () => date })),
    },
  },
}));

import { db } from '../../../infrastructure/firebase/firebase.config';
import { FirestoreUserRepository } from '../../../infrastructure/repositories/firestore-user.repository';
import { User } from '../../../domain/entities/user.entity';

// ─── mock chain setup ────────────────────────────────────────────────────────

let mockDocRef: { get: jest.Mock; set: jest.Mock };
let mockCollRef: { doc: jest.Mock };

beforeEach(() => {
  jest.resetAllMocks();

  mockDocRef = { get: jest.fn(), set: jest.fn() };
  mockCollRef = { doc: jest.fn().mockReturnValue(mockDocRef) };
  (db.collection as jest.Mock).mockReturnValue(mockCollRef);
});

describe('FirestoreUserRepository', () => {
  let repo: FirestoreUserRepository;

  beforeEach(() => {
    repo = new FirestoreUserRepository();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('persists the user document and returns the same user', async () => {
      // Arrange
      const user: User = { uid: 'u1', email: 'a@b.com', createdAt: new Date('2024-01-01') };
      mockDocRef.set.mockResolvedValue(undefined);

      // Act
      const result = await repo.create(user);

      // Assert
      expect(db.collection).toHaveBeenCalledWith('users');
      expect(mockCollRef.doc).toHaveBeenCalledWith('u1');
      expect(mockDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com' }),
      );
      expect(result).toEqual(user);
    });

    it('propagates Firestore errors', async () => {
      // Arrange
      const user: User = { uid: 'u1', email: 'a@b.com', createdAt: new Date() };
      mockDocRef.set.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(repo.create(user)).rejects.toThrow('Firestore error');
    });
  });

  // ─── getByUid ─────────────────────────────────────────────────────────────

  describe('getByUid', () => {
    it('returns the user when document exists', async () => {
      // Arrange
      const createdAt = new Date('2024-01-01');
      mockDocRef.get.mockResolvedValue({
        exists: true,
        id: 'u1',
        data: () => ({ email: 'a@b.com', createdAt: { toDate: () => createdAt } }),
      });

      // Act
      const result = await repo.getByUid('u1');

      // Assert
      expect(result).toEqual({ uid: 'u1', email: 'a@b.com', createdAt });
    });

    it('returns null when document does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue({ exists: false });

      // Act
      const result = await repo.getByUid('missing');

      // Assert
      expect(result).toBeNull();
    });

    it('propagates Firestore errors', async () => {
      // Arrange
      mockDocRef.get.mockRejectedValue(new Error('Read error'));

      // Act & Assert
      await expect(repo.getByUid('u1')).rejects.toThrow('Read error');
    });
  });
});
