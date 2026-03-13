import { firebaseAuth } from '../firebase/firebase.config';
import { IAuthService } from '../../domain/services/auth.service.interface';

export class FirebaseAuthService implements IAuthService {
  async verifyToken(token: string): Promise<{ uid: string; email: string }> {
    const decoded = await firebaseAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? '' };
  }
}
