import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { Task } from '../../domain/entities/task.entity';

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Task['priority'];
  status?: Task['status'];
  completed?: boolean;
}

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(id: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    return this.taskRepository.update(id, userId, dto);
  }
}
