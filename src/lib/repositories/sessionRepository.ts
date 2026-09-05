import { ISessionRepository } from './ISessionRepository';
import { MongoSessionRepository } from './MongoSessionRepository';
import { InMemorySessionRepository } from './InMemorySessionRepository';

// Instancia singleton para ser inyectada en todos los servicios y rutas
let sessionRepositoryInstance: ISessionRepository | null = null;

export function getSessionRepository(): ISessionRepository {
  if (!sessionRepositoryInstance) {
    // Si se especifica DB_DRIVER=memory se usa memoria, de lo contrario por defecto usa MongoDB
    if (process.env.DB_DRIVER === 'memory') {
      sessionRepositoryInstance = new InMemorySessionRepository();
    } else {
      sessionRepositoryInstance = new MongoSessionRepository();
    }
  }
  return sessionRepositoryInstance;
}

