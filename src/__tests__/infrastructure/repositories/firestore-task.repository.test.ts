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
import { FirestoreTaskRepository } from '../../../infrastructure/repositories/firestore-task.repository';
import { Task } from '../../../domain/entities/task.entity';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeDocSnapshot = (
  id: string,
  data: Record<string, unknown>,
  exists = true,
) => ({
  id,
  exists,
  data: () => (exists ? data : undefined),
});

const makeTaskData = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  title: 'Test Task',
  description: 'desc',
  priority: 'Media',
  status: 'todo',
  createdAt: { toDate: () => new Date('2024-01-01') },
  completed: false,
  ...overrides,
});

// ─── mock chain setup ────────────────────────────────────────────────────────

let mockDocRef: {
  get: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};
let mockWhereRef: { get: jest.Mock };
let mockCollRef: {
  where: jest.Mock;
  doc: jest.Mock;
  add: jest.Mock;
};

beforeEach(() => {
  jest.resetAllMocks();

  mockDocRef = { get: jest.fn(), update: jest.fn(), delete: jest.fn() };
  mockWhereRef = { get: jest.fn() };
  mockCollRef = {
    where: jest.fn().mockReturnValue(mockWhereRef),
    doc: jest.fn().mockReturnValue(mockDocRef),
    add: jest.fn(),
  };

  (db.collection as jest.Mock).mockReturnValue(mockCollRef);
});

describe('FirestoreTaskRepository', () => {
  let repo: FirestoreTaskRepository;

  beforeEach(() => {
    repo = new FirestoreTaskRepository();
  });

  // ─── getAll ───────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('returns tasks sorted by createdAt descending', async () => {
      // Arrange
      const older = makeDocSnapshot('1', makeTaskData({ createdAt: { toDate: () => new Date('2024-01-01') } }));
      const newer = makeDocSnapshot('2', makeTaskData({ createdAt: { toDate: () => new Date('2024-06-01') } }));
      mockWhereRef.get.mockResolvedValue({ docs: [older, newer] });

      // Act
      const result = await repo.getAll('user-1');

      // Assert
      expect(db.collection).toHaveBeenCalledWith('tasks');
      expect(mockCollRef.where).toHaveBeenCalledWith('userId', '==', 'user-1');
      expect(result[0].id).toBe('2'); // newer first
      expect(result[1].id).toBe('1');
    });

    it('returns an empty array when user has no tasks', async () => {
      // Arrange
      mockWhereRef.get.mockResolvedValue({ docs: [] });

      // Act
      const result = await repo.getAll('user-1');

      // Assert
      expect(result).toEqual([]);
    });

    it('applies correct default values when optional fields are missing', async () => {
      // Arrange
      const doc = makeDocSnapshot('1', {
        userId: 'user-1',
        title: 'T',
        createdAt: { toDate: () => new Date() },
      });
      mockWhereRef.get.mockResolvedValue({ docs: [doc] });

      // Act
      const [task] = await repo.getAll('user-1');

      // Assert
      expect(task.description).toBe('');
      expect(task.priority).toBe('Media');
      expect(task.status).toBe('todo');
      expect(task.completed).toBe(false);
    });
  });

  // ─── getById ─────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns a task when found and userId matches', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(makeDocSnapshot('task-1', makeTaskData()));

      // Act
      const result = await repo.getById('task-1', 'user-1');

      // Assert
      expect(mockCollRef.doc).toHaveBeenCalledWith('task-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('task-1');
    });

    it('returns null when the document does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(makeDocSnapshot('missing', {}, false));

      // Act
      const result = await repo.getById('missing', 'user-1');

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when userId does not match', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(
        makeDocSnapshot('task-1', makeTaskData({ userId: 'other-user' })),
      );

      // Act
      const result = await repo.getById('task-1', 'user-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('adds a document and returns the created task', async () => {
      // Arrange
      const createdDoc = makeDocSnapshot('new-id', makeTaskData());
      const mockAddRef = { get: jest.fn().mockResolvedValue(createdDoc) };
      mockCollRef.add.mockResolvedValue(mockAddRef);

      const taskInput: Omit<Task, 'id'> = {
        userId: 'user-1',
        title: 'Test Task',
        description: 'desc',
        priority: 'Media',
        status: 'todo',
        createdAt: new Date('2024-01-01'),
        completed: false,
      };

      // Act
      const result = await repo.create(taskInput);

      // Assert
      expect(mockCollRef.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Task', userId: 'user-1' }),
      );
      expect(result.id).toBe('new-id');
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates allowed fields and returns the refreshed task', async () => {
      // Arrange
      const existingDoc = makeDocSnapshot('task-1', makeTaskData());
      const updatedDoc = makeDocSnapshot('task-1', makeTaskData({ title: 'New title' }));
      mockDocRef.get
        .mockResolvedValueOnce(existingDoc)  // ownership check
        .mockResolvedValueOnce(updatedDoc);  // return updated

      // Act
      const result = await repo.update('task-1', 'user-1', { title: 'New title' });

      // Assert
      expect(mockDocRef.update).toHaveBeenCalledWith({ title: 'New title' });
      expect(result.title).toBe('New title');
    });

    it('ignores fields not in the allowed list', async () => {
      // Arrange
      const doc = makeDocSnapshot('task-1', makeTaskData());
      mockDocRef.get.mockResolvedValue(doc);

      // Act
      await repo.update('task-1', 'user-1', { id: 'hacked', userId: 'hacked' } as Partial<Task>);

      // Assert
      expect(mockDocRef.update).toHaveBeenCalledWith({});
    });

    it('throws when task does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(makeDocSnapshot('task-1', {}, false));

      // Act & Assert
      await expect(repo.update('task-1', 'user-1', {})).rejects.toThrow(
        'Task not found or unauthorized',
      );
    });

    it('throws when userId does not match', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(
        makeDocSnapshot('task-1', makeTaskData({ userId: 'other' })),
      );

      // Act & Assert
      await expect(repo.update('task-1', 'user-1', {})).rejects.toThrow(
        'Task not found or unauthorized',
      );
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the document when ownership is confirmed', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(makeDocSnapshot('task-1', makeTaskData()));
      mockDocRef.delete.mockResolvedValue(undefined);

      // Act
      await repo.delete('task-1', 'user-1');

      // Assert
      expect(mockDocRef.delete).toHaveBeenCalledTimes(1);
    });

    it('throws when task does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(makeDocSnapshot('task-1', {}, false));

      // Act & Assert
      await expect(repo.delete('task-1', 'user-1')).rejects.toThrow(
        'Task not found or unauthorized',
      );
    });

    it('throws when userId does not match', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValue(
        makeDocSnapshot('task-1', makeTaskData({ userId: 'other' })),
      );

      // Act & Assert
      await expect(repo.delete('task-1', 'user-1')).rejects.toThrow(
        'Task not found or unauthorized',
      );
      expect(mockDocRef.delete).not.toHaveBeenCalled();
    });
  });
});
