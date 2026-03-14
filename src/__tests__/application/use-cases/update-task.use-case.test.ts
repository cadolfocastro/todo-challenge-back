import { UpdateTaskUseCase } from '../../../application/use-cases/update-task.use-case';
import { ITaskRepository } from '../../../domain/repositories/task.repository.interface';
import { Task } from '../../../domain/entities/task.entity';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  title: 'Updated Task',
  description: 'desc',
  priority: 'Alta',
  status: 'inProgress',
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

describe('UpdateTaskUseCase', () => {
  let repo: jest.Mocked<ITaskRepository>;
  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateTaskUseCase(repo);
  });

  describe('execute', () => {
    it('delegates to repository and returns the updated task', async () => {
      // Arrange
      const updated = makeTask();
      repo.update.mockResolvedValue(updated);

      // Act
      const result = await useCase.execute('task-1', 'user-1', {
        title: 'Updated Task',
        priority: 'Alta',
      });

      // Assert
      expect(repo.update).toHaveBeenCalledWith('task-1', 'user-1', {
        title: 'Updated Task',
        priority: 'Alta',
      });
      expect(result).toEqual(updated);
    });

    it('passes partial update payload as-is', async () => {
      // Arrange
      repo.update.mockResolvedValue(makeTask({ completed: true }));

      // Act
      await useCase.execute('task-1', 'user-1', { completed: true });

      // Assert
      expect(repo.update).toHaveBeenCalledWith('task-1', 'user-1', { completed: true });
    });

    it('passes an empty update payload to repository', async () => {
      // Arrange
      repo.update.mockResolvedValue(makeTask());

      // Act
      await useCase.execute('task-1', 'user-1', {});

      // Assert
      expect(repo.update).toHaveBeenCalledWith('task-1', 'user-1', {});
    });

    it('propagates not-found / unauthorized error', async () => {
      // Arrange
      repo.update.mockRejectedValue(new Error('Task not found or unauthorized'));

      // Act & Assert
      await expect(useCase.execute('task-1', 'user-1', {})).rejects.toThrow(
        'Task not found or unauthorized',
      );
    });
  });
});
