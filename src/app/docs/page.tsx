'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const createSessionPayload = `{
  "proyectoId": "PROYECTO_PRODUCCION_01",
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
}`;

  const createSessionResponse = `{
  "sessionId": "doc_ses_8f31b29a-5e3a-4421-9dfc-1129d3cfa910",
  "serviceType": "GESTION_DOCUMENTAL",
  "url": "https://gestion-documental.miempresa.com/upload/doc_ses_8f31b29a-5e3a-4421-9dfc-1129d3cfa910",
  "expiresAt": "2026-08-24T18:05:00.000Z",
  "status": "PENDING",
  "config": {
    "proyectoId": "PROYECTO_PRODUCCION_01",
    "allowedExtensions": [".pdf", ".docx", ".png", ".jpg"],
    "maxFileSizeMB": 10,
    "maxFiles": 2,
    "title": "Carga de Documentos de Identidad",
    "description": "Adjunte su documento de identidad y comprobante de domicilio.",
    "documentoRef": "EXP-2026-00912",
    "etiquetas": ["cedula", "domicilio", "validacion"],
    "redirectUrl": "https://mi-sistema.com/tramites/retorno",
    "expiresInMinutes": 30
  }
}`;

  const getSessionResponse = `{
  "sessionId": "doc_ses_8f31b29a-5e3a-4421-9dfc-1129d3cfa910",
  "serviceType": "GESTION_DOCUMENTAL",
  "status": "COMPLETED",
  "proyectoId": "PROYECTO_PRODUCCION_01",
  "config": {
    "proyectoId": "PROYECTO_PRODUCCION_01",
    "allowedExtensions": [".pdf", ".docx", ".png", ".jpg"],
    "maxFileSizeMB": 10,
    "maxFiles": 2,
    "title": "Carga de Documentos de Identidad",
    "redirectUrl": "https://mi-sistema.com/tramites/retorno"
  },
  "documents": [
    {
      "id": "DOC-SPRING-77821",
      "originalName": "cedula_anverso.pdf",
      "fileSizeBytes": 1048576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-08-24T17:40:15.120Z",
      "rawResponse": {
        "id": "DOC-SPRING-77821",
        "status": "GUARDADO",
        "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    }
  ],
  "createdAt": "2026-08-24T17:35:00.000Z",
  "expiresAt": "2026-08-24T18:05:00.000Z",
  "completedAt": "2026-08-24T17:40:15.890Z"
}`;

  const curlCreateSnippet = `curl -X POST "https://gestion-documental.miempresa.com/api/sessions" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: prv_live_tu_llave_privada" \\
  -d '${createSessionPayload}'`;

  const jsCreateSnippet = `const response = await fetch('https://gestion-documental.miempresa.com/api/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'prv_live_tu_llave_privada'
  },
  body: JSON.stringify(${createSessionPayload})
});

const data = await response.json();
console.log('Sesión creada:', data.sessionId);
console.log('URL para el usuario:', data.url);

// Redirigir al usuario o abrir en modal/ventana:
window.location.href = data.url;`;

  const pythonCreateSnippet = `import requests

url = "https://gestion-documental.miempresa.com/api/sessions"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "prv_live_tu_llave_privada"
}
payload = ${createSessionPayload}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print(f"Sesión: {data['sessionId']}")
print(f"URL de carga: {data['url']}")`;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 pb-20 antialiased selection:bg-zinc-800 selection:text-white">
      {/* Header Limpio */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 text-zinc-900 font-semibold text-sm">
              <div className="w-6 h-6 rounded-md bg-zinc-800 text-white flex items-center justify-center text-xs font-bold font-mono">
                GD
              </div>
              <span>Gestión Documental</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-zinc-500 font-medium">Documentación API</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-600 hover:text-zinc-900 font-medium px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors"
            >
              ← Consola / Sandbox
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-20 space-y-6 text-xs">
              <div>
                <p className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px] mb-2">Introducción</p>
                <ul className="space-y-1.5 text-zinc-600">
                  <li><a href="#flujo-general" className="hover:text-zinc-900 block py-0.5">Flujo de Integración</a></li>
                  <li><a href="#autenticacion" className="hover:text-zinc-900 block py-0.5">Autenticación y Llaves</a></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px] mb-2">Endpoints</p>
                <ul className="space-y-1.5 text-zinc-600">
                  <li><a href="#crear-sesion" className="hover:text-zinc-900 block py-0.5 font-mono text-[11px]"><span className="text-zinc-800 font-semibold">POST</span> /api/sessions</a></li>
                  <li><a href="#widget-usuario" className="hover:text-zinc-900 block py-0.5 font-mono text-[11px]"><span className="text-zinc-800 font-semibold">GET</span> /upload/[id]</a></li>
                  <li><a href="#consultar-sesion" className="hover:text-zinc-900 block py-0.5 font-mono text-[11px]"><span className="text-zinc-800 font-semibold">GET</span> /api/sessions/[id]</a></li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px] mb-2">Referencia</p>
                <ul className="space-y-1.5 text-zinc-600">
                  <li><a href="#parametros-config" className="hover:text-zinc-900 block py-0.5">Parámetros de Sesión</a></li>
                  <li><a href="#codigos-error" className="hover:text-zinc-900 block py-0.5">Códigos de Respuesta</a></li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Documentation Content */}
          <main className="lg:col-span-9 space-y-8">
            {/* Header Hero */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
              <span className="text-[11px] font-mono uppercase bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                Guía de Integración
              </span>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-3">
                API de Gestión Documental
              </h1>
              <p className="text-zinc-600 text-xs sm:text-sm mt-2 leading-relaxed">
                Permite a tus aplicaciones (Angular, React, Vue, HTML o backend) generar sesiones seguras de carga y validación de archivos hacia el servicio central de almacenamiento.
              </p>
            </div>

            {/* Flujo General */}
            <section id="flujo-general" className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-zinc-900">1. Flujo de Integración</h2>
                <p className="text-zinc-500 text-xs mt-1">Paso a paso de cómo interactúa tu aplicación con el servicio:</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70">
                  <div className="w-6 h-6 rounded bg-zinc-800 text-white flex items-center justify-center font-bold text-[11px] mb-2">1</div>
                  <h3 className="font-semibold text-zinc-900 mb-1">Crea la Sesión</h3>
                  <p className="text-zinc-500 text-[11px]">Tu app hace un POST a <code className="bg-zinc-200/80 px-1 py-0.5 rounded font-mono text-[10px]">/api/sessions</code> enviando tu <code className="bg-zinc-200/80 px-1 py-0.5 rounded font-mono text-[10px]">x-api-key</code>.</p>
                </div>

                <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70">
                  <div className="w-6 h-6 rounded bg-zinc-800 text-white flex items-center justify-center font-bold text-[11px] mb-2">2</div>
                  <h3 className="font-semibold text-zinc-900 mb-1">Redirige al Usuario</h3>
                  <p className="text-zinc-500 text-[11px]">Recibes la <code className="bg-zinc-200/80 px-1 py-0.5 rounded font-mono text-[10px]">url</code> de carga y abres la interfaz para el usuario final.</p>
                </div>

                <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70">
                  <div className="w-6 h-6 rounded bg-zinc-800 text-white flex items-center justify-center font-bold text-[11px] mb-2">3</div>
                  <h3 className="font-semibold text-zinc-900 mb-1">Carga y Validación</h3>
                  <p className="text-zinc-500 text-[11px]">El usuario sube sus archivos; el servicio valida y almacena los documentos asociados al proyecto.</p>
                </div>

                <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70">
                  <div className="w-6 h-6 rounded bg-zinc-800 text-white flex items-center justify-center font-bold text-[11px] mb-2">4</div>
                  <h3 className="font-semibold text-zinc-900 mb-1">Obtén el Resultado</h3>
                  <p className="text-zinc-500 text-[11px]">El usuario retorna a tu <code className="bg-zinc-200/80 px-1 py-0.5 rounded font-mono text-[10px]">redirectUrl</code> y tú consultas los IDs generados.</p>
                </div>
              </div>
            </section>

            {/* Autenticación y Llaves */}
            <section id="autenticacion" className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-zinc-900">2. Autenticación y Credenciales</h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Cada proyecto cuenta con un par de credenciales únicas para autenticar las peticiones:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-4 space-y-2">
                  <span className="font-semibold text-zinc-900 block font-mono text-[11px]">Llave Privada (prv_live_...)</span>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Utilizada desde tu backend o servidor para <strong>crear sesiones</strong> y <strong>consultar documentos</strong>. Nunca debe exponerse en código cliente público.
                  </p>
                  <code className="block bg-[#242933] text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono">
                    x-api-key: prv_live_xxxxxxxx
                  </code>
                </div>

                <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-4 space-y-2">
                  <span className="font-semibold text-zinc-900 block font-mono text-[11px]">Llave Pública (pub_live_...)</span>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Identificador público de tu proyecto. Puede ser utilizado de forma segura en frontends o integraciones de solo lectura.
                  </p>
                  <code className="block bg-[#242933] text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono">
                    x-public-key: pub_live_xxxxxxxx
                  </code>
                </div>
              </div>
            </section>

            {/* Endpoint: Crear Sesión */}
            <section id="crear-sesion" className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase bg-zinc-800 text-white px-2 py-0.5 rounded font-mono">POST</span>
                  <code className="text-sm font-semibold text-zinc-900 font-mono">/api/sessions</code>
                </div>
                <p className="text-zinc-500 text-xs mt-2">
                  Crea una sesión de carga temporal con reglas específicas de validación, tamaño y expiración.
                </p>
              </div>

              {/* Selector de Lenguaje para Snippets */}
              <div>
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-3">
                  <span className="text-xs font-medium text-zinc-700">Ejemplo de Petición:</span>
                  <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                    <button
                      onClick={() => setActiveTab('curl')}
                      className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${activeTab === 'curl' ? 'bg-zinc-800 text-white shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setActiveTab('js')}
                      className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${activeTab === 'js' ? 'bg-zinc-800 text-white shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                    >
                      JavaScript
                    </button>
                    <button
                      onClick={() => setActiveTab('python')}
                      className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${activeTab === 'python' ? 'bg-zinc-800 text-white shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                    >
                      Python
                    </button>
                  </div>
                </div>

                {/* Bloque de código con fondo suave y elegante */}
                <div className="relative">
                  <button
                    onClick={() => copyCode(
                      activeTab === 'curl' ? curlCreateSnippet : activeTab === 'js' ? jsCreateSnippet : pythonCreateSnippet,
                      'create_code'
                    )}
                    className="absolute right-3 top-3 text-[10px] bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer"
                  >
                    {copiedSection === 'create_code' ? '¡Copiado!' : 'Copiar'}
                  </button>
                  <pre className="bg-[#242933] text-zinc-100 border border-zinc-700/60 rounded-xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed shadow-inner">
                    {activeTab === 'curl' && curlCreateSnippet}
                    {activeTab === 'js' && jsCreateSnippet}
                    {activeTab === 'python' && pythonCreateSnippet}
                  </pre>
                </div>
              </div>

              {/* Tabla de Parámetros */}
              <div id="parametros-config">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">Parámetros del Body (JSON)</h3>
                <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-semibold">
                      <tr>
                        <th className="p-3">Campo</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Obligatorio</th>
                        <th className="p-3">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-600">
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">proyectoId</td>
                        <td className="p-3 font-mono text-[11px]">string</td>
                        <td className="p-3"><span className="text-zinc-800 font-semibold bg-zinc-200/80 px-1.5 py-0.5 rounded text-[10px]">Sí</span></td>
                        <td className="p-3">Identificador del proyecto o cliente asignado.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">allowedExtensions</td>
                        <td className="p-3 font-mono text-[11px]">string[]</td>
                        <td className="p-3">No</td>
                        <td className="p-3">Extensiones permitidas. Ej: <code className="font-mono bg-zinc-100 px-1 rounded text-[10px]">[".pdf", ".docx", ".png"]</code>.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">maxFileSizeMB</td>
                        <td className="p-3 font-mono text-[11px]">number</td>
                        <td className="p-3">No</td>
                        <td className="p-3">Límite de tamaño por archivo en Megabytes (Default: 10).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">maxFiles</td>
                        <td className="p-3 font-mono text-[11px]">number</td>
                        <td className="p-3">No</td>
                        <td className="p-3">Cantidad máxima de archivos permitidos (Default: 1).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">documentoRef</td>
                        <td className="p-3 font-mono text-[11px]">string</td>
                        <td className="p-3">No</td>
                        <td className="p-3">Referencia o código de expediente asociado.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">etiquetas</td>
                        <td className="p-3 font-mono text-[11px]">string[]</td>
                        <td className="p-3">No</td>
                        <td className="p-3">Etiquetas de clasificación para los documentos.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">redirectUrl</td>
                        <td className="p-3 font-mono text-[11px]">string</td>
                        <td className="p-3">No</td>
                        <td className="p-3">URL a la que se redirige al usuario tras subir los archivos con <code className="font-mono bg-zinc-100 px-1 rounded text-[10px]">?sessionId=...&status=completed</code>.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-zinc-800">expiresInMinutes</td>
                        <td className="p-3 font-mono text-[11px]">number</td>
                        <td className="p-3">No</td>
                        <td className="p-3">Tiempo de validez de la sesión en minutos (Default: 30).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Respuesta de Creación */}
              <div>
                <span className="text-xs font-medium text-zinc-700 block mb-2">Respuesta Exitosa (HTTP 201):</span>
                <pre className="bg-[#242933] text-zinc-100 border border-zinc-700/60 rounded-xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed shadow-inner">
                  {createSessionResponse}
                </pre>
              </div>
            </section>

            {/* Endpoint / Vista: Widget de Carga */}
            <section id="widget-usuario" className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase bg-zinc-800 text-white px-2 py-0.5 rounded font-mono">GET</span>
                  <code className="text-sm font-semibold text-zinc-900 font-mono">/upload/[sessionId]</code>
                </div>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                  Interfaz web receptiva y lista para usar donde el usuario final sube los archivos requeridos según las reglas configuradas en la sesión.
                </p>
              </div>

              {/* Opciones de Integración */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">Formas de Integrar el Widget</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-4 space-y-2">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">1</span>
                      Redirección Directa
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">
                      Redirige al usuario a la <code className="bg-zinc-200/80 px-1 rounded font-mono text-[10px]">url</code> recibida al crear la sesión.
                    </p>
                    <pre className="bg-[#242933] text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
{`window.location.href = data.url;`}
                    </pre>
                  </div>

                  <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-4 space-y-2">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">2</span>
                      Enlace o Nueva Pestaña
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">
                      Abre el widget en una ventana secundaria sin interrumpir la vista principal.
                    </p>
                    <pre className="bg-[#242933] text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
{`<a href={data.url} target="_blank">
  Subir Archivos
</a>`}
                    </pre>
                  </div>

                  <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-4 space-y-2">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">3</span>
                      Iframe / Modal Embebido
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">
                      Incrusta el widget directamente dentro de un modal o contenedor en tu aplicación.
                    </p>
                    <pre className="bg-[#242933] text-zinc-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
{`<iframe 
  src={data.url} 
  className="w-full h-[520px]" 
/>`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Características y Validaciones */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Comportamiento y Validaciones Automáticas</h3>
                <ul className="space-y-2 text-xs text-zinc-600">
                  <li className="flex items-start gap-2 bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
                    <span className="text-zinc-800 font-bold">•</span>
                    <div>
                      <strong className="text-zinc-800">Validación en tiempo real:</strong> Valida formato de archivo, peso máximo en MB y cantidad antes de enviar.
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
                    <span className="text-zinc-800 font-bold">•</span>
                    <div>
                      <strong className="text-zinc-800">Control de estado:</strong> Si la sesión ya expiró o fue completada previamente, el widget bloquea el formulario y muestra la pantalla informativa correspondiente.
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
                    <span className="text-zinc-800 font-bold">•</span>
                    <div>
                      <strong className="text-zinc-800">Retorno con query params:</strong> Al finalizar la carga con éxito, redirige a la <code className="bg-zinc-200/80 px-1 rounded font-mono text-[10px]">redirectUrl</code> agregando:
                      <code className="block mt-1 bg-[#242933] text-zinc-200 p-2 rounded text-[11px] font-mono">
                        {`https://tu-sistema.com/retorno?sessionId=ses_8f31b29a...&status=completed`}
                      </code>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Endpoint: Consultar Sesión */}
            <section id="consultar-sesion" className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase bg-zinc-800 text-white px-2 py-0.5 rounded font-mono">GET</span>
                  <code className="text-sm font-semibold text-zinc-900 font-mono">/api/sessions/[sessionId]</code>
                </div>
                <p className="text-zinc-500 text-xs mt-2">
                  Permite a tu backend o frontend consultar el estado de la sesión, los IDs de documentos generados y las marcas de tiempo.
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-zinc-700 block mb-2">Respuesta (HTTP 200 con sesión completada):</span>
                <pre className="bg-[#242933] text-zinc-100 border border-zinc-700/60 rounded-xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed shadow-inner">
                  {getSessionResponse}
                </pre>
              </div>

              {/* Estados Posibles */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Estados de Sesión (<code className="font-mono">status</code>)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-50/70 border border-zinc-200 p-3 rounded-lg">
                    <span className="font-mono font-semibold text-zinc-900">PENDING</span>
                    <p className="text-zinc-500 text-[11px] mt-0.5">La sesión fue creada y está a la espera de que el usuario suba los archivos.</p>
                  </div>
                  <div className="bg-zinc-50/70 border border-zinc-200 p-3 rounded-lg">
                    <span className="font-mono font-semibold text-zinc-900">COMPLETED</span>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Los archivos fueron validados y guardados exitosamente.</p>
                  </div>
                  <div className="bg-zinc-50/70 border border-zinc-200 p-3 rounded-lg">
                    <span className="font-mono font-semibold text-zinc-900">EXPIRED</span>
                    <p className="text-zinc-500 text-[11px] mt-0.5">La sesión superó el tiempo límite (<code className="font-mono">expiresInMinutes</code>) y ya no admite cargas.</p>
                  </div>
                  <div className="bg-zinc-50/70 border border-zinc-200 p-3 rounded-lg">
                    <span className="font-mono font-semibold text-zinc-900">FAILED</span>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Ocurrió un error al procesar o guardar los documentos.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Códigos de Error */}
            <section id="codigos-error" className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-zinc-900">Códigos de Estado HTTP</h2>
              <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-semibold">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Significado</th>
                      <th className="p-3">Causa Típica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-600">
                    <tr>
                      <td className="p-3 font-mono font-bold text-zinc-800">200 / 201</td>
                      <td className="p-3">OK / Created</td>
                      <td className="p-3">Operación exitosa.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-zinc-800">400</td>
                      <td className="p-3">Bad Request</td>
                      <td className="p-3">Falta <code className="font-mono">proyectoId</code>, archivo excede tamaño o formato no permitido.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-zinc-800">404</td>
                      <td className="p-3">Not Found</td>
                      <td className="p-3">La sesión no existe en el sistema.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-zinc-800">409</td>
                      <td className="p-3">Conflict</td>
                      <td className="p-3">La sesión ya fue completada previamente y no puede reescribirse.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-zinc-800">410</td>
                      <td className="p-3">Gone</td>
                      <td className="p-3">La sesión ha expirado por tiempo límite.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-zinc-800">502</td>
                      <td className="p-3">Bad Gateway</td>
                      <td className="p-3">El servicio de almacenamiento no está disponible o rechazó la petición.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
