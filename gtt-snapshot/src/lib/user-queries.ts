import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../../db/database';
import type { User } from './types';

const db = () => getDb();

// ── User CRUD ───────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const doc = await db().collection('users').doc(email.toLowerCase()).get();
  if (!doc.exists) return null;
  return docToUser(doc.id, doc.data()!);
}

export async function getUserById(id: string): Promise<User | null> {
  const doc = await db().collection('users').doc(id).get();
  if (!doc.exists) return null;
  return docToUser(doc.id, doc.data()!);
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await db().collection('users').orderBy('created_at', 'desc').get();
  return snap.docs.map((d) => docToUser(d.id, d.data()));
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: 'admin' | 'advisor',
  invitedBy: string | null,
  mustChangePassword: boolean = true
): Promise<User> {
  const id = email.toLowerCase();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);

  const userData = {
    email: id,
    name,
    password_hash: passwordHash,
    role,
    status: 'active' as const,
    must_change_password: mustChangePassword,
    created_at: now,
    updated_at: now,
    invited_by: invitedBy ?? null,
  };

  await db().collection('users').doc(id).set(userData);

  return { id, ...userData };
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db().collection('users').doc(userId).update({
    password_hash: passwordHash,
    must_change_password: false,
    updated_at: new Date().toISOString(),
  });
}

export async function updateUserStatus(userId: string, status: 'active' | 'deactivated'): Promise<void> {
  await db().collection('users').doc(userId).update({
    status,
    updated_at: new Date().toISOString(),
  });
  if (status === 'deactivated') {
    await deleteAllUserSessions(userId);
  }
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

// ── Session CRUD ────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

  await db().collection('sessions').doc(token).set({
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

export async function validateSession(token: string): Promise<User | null> {
  if (!token) return null;

  const doc = await db().collection('sessions').doc(token).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  if (new Date(data.expires_at) < new Date()) {
    await db().collection('sessions').doc(token).delete();
    return null;
  }

  const user = await getUserById(data.user_id);
  if (!user || user.status === 'deactivated') return null;

  return user;
}

export async function deleteSession(token: string): Promise<void> {
  await db().collection('sessions').doc(token).delete();
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const snap = await db().collection('sessions').where('user_id', '==', userId).get();
  const batch = db().batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

// ── Helpers ─────────────────────────────────────────────

function docToUser(id: string, data: FirebaseFirestore.DocumentData): User {
  return {
    id,
    email: data.email,
    name: data.name,
    password_hash: data.password_hash,
    role: data.role ?? 'advisor',
    status: data.status ?? 'active',
    must_change_password: data.must_change_password ?? false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    invited_by: data.invited_by ?? null,
  };
}
