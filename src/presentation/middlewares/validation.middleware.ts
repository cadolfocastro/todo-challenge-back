import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: 'El campo "email" debe ser un correo válido' });
    return;
  }

  if (!password) {
    res.status(400).json({ message: 'El campo "password" es obligatorio' });
    return;
  }

  next();
};

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: 'El campo "email" debe ser un correo válido' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ message: 'El campo "password" debe tener al menos 6 caracteres' });
    return;
  }

  next();
};

export const validateCreateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title } = req.body as { title?: string };
  if (!title || title.trim().length === 0) {
    res.status(400).json({ message: 'El campo "title" es obligatorio' });
    return;
  }
  next();
};

const VALID_STATUSES = ['todo', 'inProgress', 'done'];
const VALID_PRIORITIES = ['Baja', 'Media', 'Alta'];

export const validateUpdateTask = (req: Request, res: Response, next: NextFunction): void => {
  const body = req.body as Record<string, unknown>;

  if (body['status'] !== undefined && !VALID_STATUSES.includes(body['status'] as string)) {
    res.status(400).json({ message: 'status debe ser: todo | inProgress | done' });
    return;
  }

  if (body['priority'] !== undefined && !VALID_PRIORITIES.includes(body['priority'] as string)) {
    res.status(400).json({ message: 'priority debe ser: Baja | Media | Alta' });
    return;
  }

  next();
};
