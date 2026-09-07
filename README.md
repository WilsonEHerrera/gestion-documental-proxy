# Proxy de Gestión Documental

Servicio intermediario seguro y modular para la integración de carga y custodia de documentos con sistemas empresariales (SpringBoot, MongoDB).

---

## 🚀 Características

- **Autenticación Multi-tenant**: Proyectos registrados en MongoDB con llaves públicas y privadas (`prv_live_...` / `pub_live_...`).
- **Sesiones Temporales**: Creación de enlaces de carga efímeros con control de tiempo (`expiresInMinutes`).
- **Validación Robusta**: Restricciones de tipo de archivo (`allowedExtensions`), tamaño máximo (`maxFileSizeMB`) y cantidad (`maxFiles`).
- **Documentación Interactiva**: Módulo visual disponible en `/docs` con snippets en cURL, JavaScript y Python.

---

## 🔐 Autenticación

Todas las solicitudes a endpoints de backend deben autenticarse enviando la llave privada del proyecto:

```http
x-api-key: prv_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
*También se admite `Authorization: Bearer <LLAVE_PRIVADA>` o `x-private-key: <LLAVE_PRIVADA>`.*

---

## 📡 API Endpoints

### 1. Crear Sesión de Carga
`POST /api/sessions`

> **Nota:** El `proyectoId` **no es obligatorio** en el body. Se deduce y asocia automáticamente al proyecto autenticado mediante la API Key en MongoDB.

**Headers:**
```http
Content-Type: application/json
x-api-key: prv_live_tu_llave_privada
```

**Body (JSON):**
```json
{
  "allowedExtensions": [".pdf", ".docx", ".png", ".jpg"],
  "maxFileSizeMB": 10,
  "maxFiles": 2,
  "title": "Carga de Documentos de Identidad",
  "description": "Adjunte su documento de identidad y comprobante de domicilio.",
  "documentoRef": "EXP-2026-00912",
  "etiquetas": ["cedula", "domicilio", "validacion"],
  "redirectUrl": "https://mi-sistema.com/tramites/retorno",
  "metadata": {
    "usuarioId": "usr_991823",
    "departamento": "finanzas"
  },
  "expiresInMinutes": 30
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "sessionId": "doc_ses_8f31b29a-5e3a-4421-9dfc-1129d3cfa910",
  "serviceType": "GESTION_DOCUMENTAL",
  "url": "https://tu-dominio.com/upload/doc_ses_8f31b29a-5e3a-4421-9dfc-1129d3cfa910",
  "expiresAt": "2026-09-07T13:30:00.000Z",
  "status": "PENDING"
}
```

---

### 2. Consultar Estado de Sesión
`GET /api/sessions/{sessionId}`

**Headers:**
```http
x-api-key: prv_live_tu_llave_privada
```

**Respuesta (200 OK):**
```json
{
  "sessionId": "doc_ses_8f31b29a-5e3a-4421-9dfc-1129d3cfa910",
  "status": "COMPLETED",
  "proyectoId": "PROYECTO_DEMO_01",
  "documents": [
    {
      "id": "DOC-77821",
      "originalName": "cedula.pdf",
      "fileSizeBytes": 1048576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-09-07T13:05:00.000Z"
    }
  ],
  "createdAt": "2026-09-07T12:50:00.000Z",
  "expiresAt": "2026-09-07T13:20:00.000Z"
}
```

---

## 🛠️ CLI: Creación de Proyectos

Para registrar un nuevo proyecto y generar sus llaves de API:

```bash
node scripts/create-project.mjs <projectId> [nombre] [descripcion] [servicios]
```

**Ejemplo:**
```bash
node scripts/create-project.mjs PROY_CLIENTE_01 "Portal Clientes" "Carga de documentos" "DOCUMENTS,QUESTIONNAIRES"
```

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para el sandbox o [http://localhost:3000/docs](http://localhost:3000/docs) para la documentación interactiva.
