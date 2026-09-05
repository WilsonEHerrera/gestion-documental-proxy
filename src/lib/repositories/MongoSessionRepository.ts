import { Collection, Db } from 'mongodb';
import { DocumentSession } from '@/types/session';
import { ISessionRepository } from './ISessionRepository';
import { getDatabase } from '../db/mongodb';
import { isExpired } from '../utils/dateUtils';

export class MongoSessionRepository implements ISessionRepository {
  private collectionName = 'document_sessions';
  private indexCreated = false;

  private async getCollection(): Promise<Collection<DocumentSession>> {
    const db: Db = await getDatabase();
    const collection = db.collection<DocumentSession>(this.collectionName);

    if (!this.indexCreated) {
      // Garantizar índice único en sessionId
      try {
        await collection.createIndex({ sessionId: 1 }, { unique: true });
        this.indexCreated = true;
      } catch (err) {
        console.warn('Advertencia al crear índice de sesiones en MongoDB:', err);
      }
    }

    return collection;
  }

  async create(session: DocumentSession): Promise<DocumentSession> {
    const collection = await this.getCollection();
    // Guardamos una copia limpia
    await collection.insertOne({ ...session });
    return { ...session };
  }

  async findById(sessionId: string): Promise<DocumentSession | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ sessionId }, { projection: { _id: 0 } });

    if (!doc) {
      return null;
    }

    // Verificar si la sesión ha expirado y sigue en estado PENDING
    if (doc.status === 'PENDING' && isExpired(doc.expiresAt)) {
      doc.status = 'EXPIRED';
      await collection.updateOne({ sessionId }, { $set: { status: 'EXPIRED' } });
    }

    return doc as DocumentSession;
  }

  async update(sessionId: string, patch: Partial<DocumentSession>): Promise<DocumentSession | null> {
    const collection = await this.getCollection();
    const existing = await this.findById(sessionId);

    if (!existing) {
      return null;
    }

    const updatedConfig = patch.config
      ? { ...existing.config, ...patch.config }
      : existing.config;

    const updateDoc: Partial<DocumentSession> = {
      ...patch,
      config: updatedConfig,
    };

    await collection.updateOne(
      { sessionId },
      { $set: updateDoc }
    );

    return this.findById(sessionId);
  }

  async delete(sessionId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ sessionId });
    return result.deletedCount > 0;
  }

  async findAll(limit = 50): Promise<DocumentSession[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const now = new Date().getTime();
    const results: DocumentSession[] = [];

    for (const doc of docs) {
      const session = doc as DocumentSession;
      const expiresAt = new Date(session.expiresAt).getTime();
      if (session.status === 'PENDING' && now > expiresAt) {
        session.status = 'EXPIRED';
        // Actualizar en segundo plano en mongo
        collection.updateOne({ sessionId: session.sessionId }, { $set: { status: 'EXPIRED' } }).catch(() => {});
      }
      results.push(session);
    }

    return results;
  }
}
