export type SessionStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';

export interface SessionConfig {
  /** Identificador de proyecto o apiKey para la gestión documental */
  proyectoId: string;
  /** Extensiones permitidas, por ejemplo: [".pdf", ".docx", ".png", ".jpg"] */
  allowedExtensions: string[];
  /** Tamaño máximo permitido por archivo en Megabytes (ej: 10) */
  maxFileSizeMB: number;
  /** Cantidad máxima de archivos permitidos (1 para un solo archivo, >1 para múltiples) */
  maxFiles: number;
  /** Título personalizado mostrado en el widget de carga */
  title?: string;
  /** Descripción o instrucciones para el usuario */
  description?: string;
  /** Referencia de documento opcional para SpringBoot (documentoRef) */
  documentoRef?: string;
  /** Etiquetas asociadas para SpringBoot (etiquetas) */
  etiquetas?: string[];
  /** URL a la que se redirige al usuario al completar la carga exitosamente */
  redirectUrl?: string;
  /** Metadatos adicionales que el integrador necesite asociar a la sesión */
  metadata?: Record<string, unknown>;
  /** Tiempo de vida de la sesión en minutos (por defecto 30 minutos) */
  expiresInMinutes?: number;
}

export interface UploadedDocumentResult {
  /** ID devuelto por la API de Gestión Documental SpringBoot */
  id: string;
  /** Nombre original del archivo */
  originalName: string;
  /** Tamaño en bytes */
  fileSizeBytes: number;
  /** Tipo MIME */
  mimeType: string;
  /** Respuesta cruda devuelta por SpringBoot */
  rawResponse?: unknown;
  /** Fecha ISO de la subida */
  uploadedAt: string;
}

export interface DocumentSession {
  sessionId: string;
  serviceType: 'GESTION_DOCUMENTAL';
  status: SessionStatus;
  proyectoId: string;
  config: SessionConfig;
  /** Lista de documentos procesados y subidos exitosamente */
  documents: UploadedDocumentResult[];
  /** Mensaje de error si la sesión falló */
  error?: string;
  /** Fecha ISO de creación */
  createdAt: string;
  /** Fecha ISO de expiración */
  expiresAt: string;
  /** Fecha ISO de finalización */
  completedAt?: string;
}

export interface CreateSessionDto {
  /** Identificador opcional; si no se envía, se deduce automáticamente del proyecto autenticado por API Key */
  proyectoId?: string;
  allowedExtensions?: string[];
  maxFileSizeMB?: number;
  maxFiles?: number;
  title?: string;
  description?: string;
  documentoRef?: string;
  etiquetas?: string[];
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
  expiresInMinutes?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  url: string;
  expiresAt: string;
  status: SessionStatus;
}
