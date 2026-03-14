import { DeleteTaskUseCase } from '../../../application/use-cases/delete-task.use-case';
import { ITaskRepository } from '../../../domain/repositories/task.repository.interface';

const makeRepo = (): jest.Mocked<ITaskRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('DeleteTaskUseCase', () => {
  let repo: jest.Mocked<ITaskRepository>;
  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteTaskUseCase(repo);
  });

  describe('execute', () => {
    it('delegates deletion to the repository with correct id and userId', async () => {
      // Arrange
      repo.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('task-1', 'user-1');

      // Assert
      expect(repo.delete).toHaveBeenCalledWith('task-1', 'user-1');
      expect(repo.delete).toHaveBeenCalledTimes(1);
    });

    it('propagates not-found / unauthorized error from repository', async () => {
      // Arrange
      repo.delete.mockRejectedValue(new Error('Task not found or unauthorized'));

      // Act & Assert
      await expect(useCase.execute('task-1', 'user-1')).rejects.toThrow(
        'Task not found or unauthorized',
      );
    });

    it('propagates generic repository errors', async () => {
      // Arrange
      repo.delete.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(useCase.execute('task-1', 'user-1')).rejects.toThrow('DB error');
    });
  });
});
