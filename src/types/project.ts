export type ApiServiceType = 'DOCUMENTS' | 'QUESTIONNAIRES' | string;

export interface Project {
  projectId: string;
  name: string;
  publicKey: string;
  privateKey: string;
  isActive: boolean;
  /** Servicios autorizados para este proyecto. Ej: ['DOCUMENTS', 'QUESTIONNAIRES'] */
  services?: string[];
  createdAt: string;
  allowedOrigins?: string[];
  description?: string;
}

export interface CreateProjectDto {
  projectId: string;
  name: string;
  description?: string;
  services?: string[];
}
