import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateCreateTask, validateUpdateTask } from '../middlewares/validation.middleware';
import { TaskController } from '../controllers/task.controller';
import { FirestoreTaskRepository } from '../../infrastructure/repositories/firestore-task.repository';

const router = Router();
const taskController = new TaskController(new FirestoreTaskRepository());

router.get('/', authMiddleware, taskController.getAll.bind(taskController));
router.post('/', authMiddleware, validateCreateTask, taskController.create.bind(taskController));
router.patch('/:id', authMiddleware, validateUpdateTask, taskController.update.bind(taskController));
router.delete('/:id', authMiddleware, taskController.remove.bind(taskController));

export default router;
