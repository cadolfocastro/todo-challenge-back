import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(user: User): Promise<User>;
  getByUid(uid: string): Promise<User | null>;
}
