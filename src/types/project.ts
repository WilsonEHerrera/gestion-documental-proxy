export interface Project {
  projectId: string;
  name: string;
  publicKey: string;
  privateKey: string;
  isActive: boolean;
  createdAt: string;
  allowedOrigins?: string[];
  description?: string;
}

export interface CreateProjectDto {
  projectId: string;
  name: string;
  description?: string;
}
