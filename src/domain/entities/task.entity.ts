export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta';
  status: 'todo' | 'inProgress' | 'done';
  createdAt: Date;
  completed: boolean;
}
