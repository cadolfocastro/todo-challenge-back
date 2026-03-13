import * as admin from 'firebase-admin';
import { db } from '../firebase/firebase.config';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { Task } from '../../domain/entities/task.entity';

type TaskDoc = admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot;

const ALLOWED_UPDATE_FIELDS: (keyof Task)[] = [
  'title',
  'description',
  'priority',
  'status',
  'completed',
];

export class FirestoreTaskRepository implements ITaskRepository {
  private readonly collection = 'tasks';

  private toTask(doc: TaskDoc): Task {
    const data = doc.data()!;
    return {
      id: doc.id,
      userId: data['userId'] as string,
      title: data['title'] as string,
      description: (data['description'] as string) ?? '',
      priority: (data['priority'] as Task['priority']) ?? 'Media',
      status: (data['status'] as Task['status']) ?? 'todo',
      createdAt: (data['createdAt'] as admin.firestore.Timestamp)?.toDate() ?? new Date(),
      completed: (data['completed'] as boolean) ?? false,
    };
  }

  async getAll(userId: string): Promise<Task[]> {
    const snapshot = await db
      .collection(this.collection)
      .where('userId', '==', userId)
      .get();
    return snapshot.docs
      .map(doc => this.toTask(doc))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string, userId: string): Promise<Task | null> {
    const doc = await db.collection(this.collection).doc(id).get();
    if (!doc.exists || (doc.data()?.['userId'] as string) !== userId) return null;
    return this.toTask(doc);
  }

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    const ref = await db.collection(this.collection).add({
      ...task,
      createdAt: admin.firestore.Timestamp.fromDate(task.createdAt),
    });
    const created = await ref.get();
    return this.toTask(created);
  }

  async update(id: string, userId: string, data: Partial<Task>): Promise<Task> {
    const ref = db.collection(this.collection).doc(id);
    const existing = await ref.get();

    if (!existing.exists || (existing.data()?.['userId'] as string) !== userId) {
      throw new Error('Task not found or unauthorized');
    }

    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await ref.update(updateData);
    const updated = await ref.get();
    return this.toTask(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const ref = db.collection(this.collection).doc(id);
    const existing = await ref.get();

    if (!existing.exists || (existing.data()?.['userId'] as string) !== userId) {
      throw new Error('Task not found or unauthorized');
    }

    await ref.delete();
  }
}
