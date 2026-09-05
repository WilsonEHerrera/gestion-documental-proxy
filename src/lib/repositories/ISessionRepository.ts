import { DocumentSession } from '@/types/session';

export interface ISessionRepository {
  /**
   * Guarda una nueva sesión en el almacenamiento.
   */
  create(session: DocumentSession): Promise<DocumentSession>;

  /**
   * Busca una sesión por su ID único. Si ha expirado, actualiza su estado o la marca como EXPIRED.
   */
  findById(sessionId: string): Promise<DocumentSession | null>;

  /**
   * Actualiza los campos de una sesión existente.
   */
  update(sessionId: string, patch: Partial<DocumentSession>): Promise<DocumentSession | null>;

  /**
   * Elimina una sesión del almacenamiento.
   */
  delete(sessionId: string): Promise<boolean>;

  /**
   * Lista todas las sesiones activas o históricas (útil para administración/debug).
   */
  findAll(limit?: number): Promise<DocumentSession[]>;
}
