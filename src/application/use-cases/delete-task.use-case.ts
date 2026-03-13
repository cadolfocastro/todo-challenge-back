import { ITaskRepository } from '../../domain/repositories/task.repository.interface';

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string, userId: string): Promise<void> {
    return this.taskRepository.delete(id, userId);
  }
}
