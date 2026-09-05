import { DocumentSession } from '@/types/session';
import { ISessionRepository } from './ISessionRepository';

// Usamos globalThis para preservar el mapa en memoria durante Hot Module Reload en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var __sessionStorageMap: Map<string, DocumentSession> | undefined;
}

export class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, DocumentSession>;

  constructor() {
    if (!global.__sessionStorageMap) {
      global.__sessionStorageMap = new Map<string, DocumentSession>();
    }
    this.sessions = global.__sessionStorageMap;
  }

  async create(session: DocumentSession): Promise<DocumentSession> {
    this.sessions.set(session.sessionId, { ...session });
    return { ...session };
  }

  async findById(sessionId: string): Promise<DocumentSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Verificar si la sesión ha expirado y sigue en estado PENDING
    const now = new Date().getTime();
    const expiresAt = new Date(session.expiresAt).getTime();

    if (session.status === 'PENDING' && now > expiresAt) {
      session.status = 'EXPIRED';
      this.sessions.set(sessionId, { ...session });
    }

    return { ...session };
  }

  async update(sessionId: string, patch: Partial<DocumentSession>): Promise<DocumentSession | null> {
    const existing = await this.findById(sessionId);
    if (!existing) {
      return null;
    }

    const updated: DocumentSession = {
      ...existing,
      ...patch,
      config: patch.config ? { ...existing.config, ...patch.config } : existing.config,
    };

    this.sessions.set(sessionId, updated);
    return { ...updated };
  }

  async delete(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async findAll(limit = 50): Promise<DocumentSession[]> {
    const list: DocumentSession[] = [];
    for (const session of this.sessions.values()) {
      // Validar expiración al listar
      const now = new Date().getTime();
      const expiresAt = new Date(session.expiresAt).getTime();
      if (session.status === 'PENDING' && now > expiresAt) {
        session.status = 'EXPIRED';
      }
      list.push({ ...session });
      if (list.length >= limit) break;
    }
    // Ordenar de más reciente a más antiguo
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
