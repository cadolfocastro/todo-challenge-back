import * as admin from 'firebase-admin';
import { db } from '../firebase/firebase.config';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

export class FirestoreUserRepository implements IUserRepository {
  private readonly collection = 'users';

  async create(user: User): Promise<User> {
    await db.collection(this.collection).doc(user.uid).set({
      email: user.email,
      createdAt: admin.firestore.Timestamp.fromDate(user.createdAt),
    });
    return user;
  }

  async getByUid(uid: string): Promise<User | null> {
    const doc = await db.collection(this.collection).doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      uid: doc.id,
      email: data['email'] as string,
      createdAt: (data['createdAt'] as admin.firestore.Timestamp).toDate(),
    };
  }
}
