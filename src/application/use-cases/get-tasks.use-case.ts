import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { Task } from '../../domain/entities/task.entity';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(userId: string): Promise<Task[]> {
    return this.taskRepository.getAll(userId);
  }
}
