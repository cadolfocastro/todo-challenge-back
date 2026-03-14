import { Request, Response } from 'express';
import { TaskController } from '../../../presentation/controllers/task.controller';
import { ITaskRepository } from '../../../domain/repositories/task.repository.interface';
import { Task } from '../../../domain/entities/task.entity';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  title: 'Test Task',
  description: '',
  priority: 'Media',
  status: 'todo',
  createdAt: new Date('2024-01-01'),
  completed: false,
  ...overrides,
});

const makeRepo = (): jest.Mocked<ITaskRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const authenticatedReq = (
  body: unknown = {},
  params: Record<string, string> = {},
): Request =>
  ({
    body,
    params,
    user: { uid: 'user-1', email: 'user@test.com' },
  }) as unknown as Request;

describe('TaskController', () => {
  let repo: jest.Mocked<ITaskRepository>;
  let controller: TaskController;

  beforeEach(() => {
    repo = makeRepo();
    controller = new TaskController(repo);
  });

  // ─── getAll ─────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('responds 200 with the list of tasks', async () => {
      // Arrange
      const tasks = [makeTask()];
      repo.getAll.mockResolvedValue(tasks);
      const req = authenticatedReq();
      const res = mockRes();

      // Act
      await controller.getAll(req, res);

      // Assert
      expect(repo.getAll).toHaveBeenCalledWith('user-1');
      expect(res.json).toHaveBeenCalledWith(tasks);
    });

    it('responds 500 on repository error', async () => {
      // Arrange
      repo.getAll.mockRejectedValue(new Error('DB error'));
      const req = authenticatedReq();
      const res = mockRes();

      // Act
      await controller.getAll(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('responds 201 with the created task', async () => {
      // Arrange
      const task = makeTask();
      repo.create.mockResolvedValue(task);
      const req = authenticatedReq({ title: 'Test Task' });
      const res = mockRes();

      // Act
      await controller.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(task);
    });

    it('responds 500 on repository error', async () => {
      // Arrange
      repo.create.mockRejectedValue(new Error('DB error'));
      const req = authenticatedReq({ title: 'Test Task' });
      const res = mockRes();

      // Act
      await controller.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('responds 200 with the updated task', async () => {
      // Arrange
      const updated = makeTask({ title: 'Updated' });
      repo.update.mockResolvedValue(updated);
      const req = authenticatedReq({ title: 'Updated' }, { id: 'task-1' });
      const res = mockRes();

      // Act
      await controller.update(req, res);

      // Assert
      expect(repo.update).toHaveBeenCalledWith('task-1', 'user-1', { title: 'Updated' });
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responds 404 when task is not found', async () => {
      // Arrange
      repo.update.mockRejectedValue(new Error('Task not found or unauthorized'));
      const req = authenticatedReq({}, { id: 'missing' });
      const res = mockRes();

      // Act
      await controller.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responds 500 for unexpected errors', async () => {
      // Arrange
      repo.update.mockRejectedValue(new Error('DB error'));
      const req = authenticatedReq({}, { id: 'task-1' });
      const res = mockRes();

      // Act
      await controller.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('responds 500 with generic message when error is not an Error instance', async () => {
      // Arrange
      repo.update.mockRejectedValue('string error');
      const req = authenticatedReq({}, { id: 'task-1' });
      const res = mockRes();

      // Act
      await controller.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('responds 204 on successful deletion', async () => {
      // Arrange
      repo.delete.mockResolvedValue(undefined);
      const req = authenticatedReq({}, { id: 'task-1' });
      const res = mockRes();

      // Act
      await controller.remove(req, res);

      // Assert
      expect(repo.delete).toHaveBeenCalledWith('task-1', 'user-1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('responds 404 when task is not found', async () => {
      // Arrange
      repo.delete.mockRejectedValue(new Error('Task not found or unauthorized'));
      const req = authenticatedReq({}, { id: 'missing' });
      const res = mockRes();

      // Act
      await controller.remove(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responds 500 for unexpected errors', async () => {
      // Arrange
      repo.delete.mockRejectedValue(new Error('DB error'));
      const req = authenticatedReq({}, { id: 'task-1' });
      const res = mockRes();

      // Act
      await controller.remove(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('responds 500 with generic message when error is not an Error instance', async () => {
      // Arrange
      repo.delete.mockRejectedValue('string error');
      const req = authenticatedReq({}, { id: 'task-1' });
      const res = mockRes();

      // Act
      await controller.remove(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
