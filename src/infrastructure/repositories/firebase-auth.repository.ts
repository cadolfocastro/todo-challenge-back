import { firebaseAuth } from "../firebase/firebase.config";
import {
  IAuthRepository,
  AuthTokenResult,
} from "../../domain/repositories/auth.repository.interface";

type FirebaseRestResponse = {
  idToken: string;
  email: string;
  localId: string;
  error?: { message: string };
};

async function firebaseRestRequest(
  endpoint: "accounts:signInWithPassword" | "accounts:signUp",
  email: string,
  password: string,
): Promise<AuthTokenResult> {
  const FIREBASE_API_KEY = process.env["FIREBASE_API_KEY"] ?? "";
  const url = `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = (await response.json()) as FirebaseRestResponse;

  if (!response.ok) {
    const code = data.error?.message ?? "UNKNOWN";
    const err = new Error(code) as Error & { code: string };
    err.code = code;
    throw err;
  }

  return { uid: data.localId, email: data.email, token: data.idToken };
}

export class FirebaseAuthRepository implements IAuthRepository {
  async verifyToken(token: string): Promise<{ uid: string; email: string }> {
    const decoded = await firebaseAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  }

  async signIn(email: string, password: string): Promise<AuthTokenResult> {
    return firebaseRestRequest("accounts:signInWithPassword", email, password);
  }

  async register(email: string, password: string): Promise<AuthTokenResult> {
    return firebaseRestRequest("accounts:signUp", email, password);
  }
}
