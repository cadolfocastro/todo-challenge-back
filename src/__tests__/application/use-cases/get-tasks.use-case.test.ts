import { GetTasksUseCase } from '../../../application/use-cases/get-tasks.use-case';
import { ITaskRepository } from '../../../domain/repositories/task.repository.interface';
import { Task } from '../../../domain/entities/task.entity';

const makeTask = (id: string): Task => ({
  id,
  userId: 'user-1',
  title: `Task ${id}`,
  description: '',
  priority: 'Media',
  status: 'todo',
  createdAt: new Date('2024-01-01'),
  completed: false,
});

const makeRepo = (): jest.Mocked<ITaskRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('GetTasksUseCase', () => {
  let repo: jest.Mocked<ITaskRepository>;
  let useCase: GetTasksUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetTasksUseCase(repo);
  });

  describe('execute', () => {
    it('returns all tasks for the given userId', async () => {
      // Arrange
      const tasks = [makeTask('1'), makeTask('2')];
      repo.getAll.mockResolvedValue(tasks);

      // Act
      const result = await useCase.execute('user-1');

      // Assert
      expect(repo.getAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(tasks);
    });

    it('returns an empty array when user has no tasks', async () => {
      // Arrange
      repo.getAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute('user-1');

      // Assert
      expect(result).toEqual([]);
    });

    it('calls the repository with exactly the userId provided', async () => {
      // Arrange
      repo.getAll.mockResolvedValue([]);

      // Act
      await useCase.execute('specific-uid-123');

      // Assert
      expect(repo.getAll).toHaveBeenCalledWith('specific-uid-123');
      expect(repo.getAll).toHaveBeenCalledTimes(1);
    });

    it('propagates repository errors', async () => {
      // Arrange
      repo.getAll.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(useCase.execute('user-1')).rejects.toThrow('DB error');
    });
  });
});
