import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { Task } from '../../domain/entities/task.entity';

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Task['priority'];
  status?: Task['status'];
}

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  execute(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task: Omit<Task, 'id'> = {
      userId,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? '',
      priority: dto.priority ?? 'Media',
      status: dto.status ?? 'todo',
      createdAt: new Date(),
      completed: false,
    };
    return this.taskRepository.create(task);
  }
}
