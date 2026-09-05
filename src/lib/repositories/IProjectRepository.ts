import { Project } from '@/types/project';

export interface IProjectRepository {
  findByPrivateKey(privateKey: string): Promise<Project | null>;
  findByPublicKey(publicKey: string): Promise<Project | null>;
  findByProjectId(projectId: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  findAll(): Promise<Project[]>;
  update(projectId: string, patch: Partial<Project>): Promise<Project | null>;
}
