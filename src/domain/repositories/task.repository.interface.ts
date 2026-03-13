import { Task } from '../entities/task.entity';

export interface ITaskRepository {
  getAll(userId: string): Promise<Task[]>;
  getById(id: string, userId: string): Promise<Task | null>;
  create(task: Omit<Task, 'id'>): Promise<Task>;
  update(id: string, userId: string, data: Partial<Task>): Promise<Task>;
  delete(id: string, userId: string): Promise<void>;
}
