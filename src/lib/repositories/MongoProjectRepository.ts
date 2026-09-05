import { Collection, Db } from 'mongodb';
import { Project } from '@/types/project';
import { IProjectRepository } from './IProjectRepository';
import { getDatabase } from '../db/mongodb';
import { formatLocalDateTime } from '../utils/dateUtils';

export class MongoProjectRepository implements IProjectRepository {
  private collectionName = 'projects';
  private initialized = false;

  private async getCollection(): Promise<Collection<Project>> {
    const db: Db = await getDatabase();
    const collection = db.collection<Project>(this.collectionName);

    if (!this.initialized) {
      try {
        await collection.createIndex({ projectId: 1 }, { unique: true });
        await collection.createIndex({ privateKey: 1 }, { unique: true });
        await collection.createIndex({ publicKey: 1 }, { unique: true });

        // Auto-semilla de proyecto demo inicial si la colección está vacía
        const count = await collection.countDocuments();
        if (count === 0) {
          const defaultProject: Project = {
            projectId: 'PROYECTO_DEMO_01',
            name: 'Proyecto Demo Inicial',
            publicKey: 'pub_live_demo123456789',
            privateKey: 'prv_live_demo123456789',
            isActive: true,
            createdAt: formatLocalDateTime(),
            description: 'Proyecto de prueba por defecto para sandbox e integraciones locales.',
          };
          await collection.insertOne({ ...defaultProject });
          console.log('[MongoProjectRepository] Proyecto demo inicial creado automáticamente.');
        }

        this.initialized = true;
      } catch (err) {
        console.warn('Advertencia al inicializar colección de proyectos en MongoDB:', err);
      }
    }

    return collection;
  }

  async findByPrivateKey(privateKey: string): Promise<Project | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ privateKey, isActive: true }, { projection: { _id: 0 } });
    return doc as Project | null;
  }

  async findByPublicKey(publicKey: string): Promise<Project | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ publicKey, isActive: true }, { projection: { _id: 0 } });
    return doc as Project | null;
  }

  async findByProjectId(projectId: string): Promise<Project | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ projectId }, { projection: { _id: 0 } });
    return doc as Project | null;
  }

  async create(project: Project): Promise<Project> {
    const collection = await this.getCollection();
    await collection.insertOne({ ...project });
    return { ...project };
  }

  async findAll(): Promise<Project[]> {
    const collection = await this.getCollection();
    const docs = await collection.find({}, { projection: { _id: 0 } }).toArray();
    return docs as Project[];
  }

  async update(projectId: string, patch: Partial<Project>): Promise<Project | null> {
    const collection = await this.getCollection();
    await collection.updateOne({ projectId }, { $set: patch });
    return this.findByProjectId(projectId);
  }
}

let projectRepositoryInstance: IProjectRepository | null = null;

export function getProjectRepository(): IProjectRepository {
  if (!projectRepositoryInstance) {
    projectRepositoryInstance = new MongoProjectRepository();
  }
  return projectRepositoryInstance;
}
