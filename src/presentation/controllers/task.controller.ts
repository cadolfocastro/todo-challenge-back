import { Request, Response } from 'express';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { GetTasksUseCase } from '../../application/use-cases/get-tasks.use-case';
import { CreateTaskUseCase, CreateTaskDto } from '../../application/use-cases/create-task.use-case';
import { UpdateTaskUseCase, UpdateTaskDto } from '../../application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../../application/use-cases/delete-task.use-case';

export class TaskController {
  private readonly getTasksUseCase: GetTasksUseCase;
  private readonly createTaskUseCase: CreateTaskUseCase;
  private readonly updateTaskUseCase: UpdateTaskUseCase;
  private readonly deleteTaskUseCase: DeleteTaskUseCase;

  constructor(taskRepository: ITaskRepository) {
    this.getTasksUseCase = new GetTasksUseCase(taskRepository);
    this.createTaskUseCase = new CreateTaskUseCase(taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await this.getTasksUseCase.execute(req.user!.uid);
      res.json(tasks);
    } catch (error) {
      console.error('[TaskController.getAll]', error);
      res.status(500).json({ message: 'Error al obtener tareas' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const task = await this.createTaskUseCase.execute(req.user!.uid, req.body as CreateTaskDto);
      res.status(201).json(task);
    } catch {
      res.status(500).json({ message: 'Error al crear tarea' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const task = await this.updateTaskUseCase.execute(
        req.params['id']!,
        req.user!.uid,
        req.body as UpdateTaskDto,
      );
      res.json(task);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar tarea';
      res.status(message.includes('not found') ? 404 : 500).json({ message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteTaskUseCase.execute(req.params['id']!, req.user!.uid);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar tarea';
      res.status(message.includes('not found') ? 404 : 500).json({ message });
    }
  }
}
