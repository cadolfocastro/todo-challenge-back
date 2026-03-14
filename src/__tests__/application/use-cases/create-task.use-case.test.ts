import { CreateTaskUseCase } from '../../../application/use-cases/create-task.use-case';
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

describe('CreateTaskUseCase', () => {
  let repo: jest.Mocked<ITaskRepository>;
  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new CreateTaskUseCase(repo);
  });

  describe('execute', () => {
    it('creates a task with required title using defaults', async () => {
      // Arrange
      const expected = makeTask();
      repo.create.mockResolvedValue(expected);

      // Act
      const result = await useCase.execute('user-1', { title: 'Test Task' });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Test Task',
          description: '',
          priority: 'Media',
          status: 'todo',
          completed: false,
        }),
      );
      expect(result).toEqual(expected);
    });

    it('trims leading and trailing whitespace from title', async () => {
      // Arrange
      repo.create.mockResolvedValue(makeTask({ title: 'Trimmed' }));

      // Act
      await useCase.execute('user-1', { title: '  Trimmed  ' });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Trimmed' }),
      );
    });

    it('trims whitespace from description', async () => {
      // Arrange
      repo.create.mockResolvedValue(makeTask({ description: 'desc' }));

      // Act
      await useCase.execute('user-1', { title: 'T', description: '  desc  ' });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'desc' }),
      );
    });

    it('uses provided priority instead of default', async () => {
      // Arrange
      repo.create.mockResolvedValue(makeTask({ priority: 'Alta' }));

      // Act
      await useCase.execute('user-1', { title: 'T', priority: 'Alta' });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'Alta' }),
      );
    });

    it('uses provided status instead of default', async () => {
      // Arrange
      repo.create.mockResolvedValue(makeTask({ status: 'inProgress' }));

      // Act
      await useCase.execute('user-1', { title: 'T', status: 'inProgress' });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inProgress' }),
      );
    });

    it('sets completed to false always', async () => {
      // Arrange
      repo.create.mockResolvedValue(makeTask());

      // Act
      await useCase.execute('user-1', { title: 'T' });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ completed: false }),
      );
    });

    it('sets createdAt as a Date instance', async () => {
      // Arrange
      repo.create.mockResolvedValue(makeTask());

      // Act
      await useCase.execute('user-1', { title: 'T' });

      // Assert
      const calledWith = repo.create.mock.calls[0][0];
      expect(calledWith.createdAt).toBeInstanceOf(Date);
    });

    it('propagates repository errors', async () => {
      // Arrange
      repo.create.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(useCase.execute('user-1', { title: 'T' })).rejects.toThrow('DB error');
    });
  });
});
