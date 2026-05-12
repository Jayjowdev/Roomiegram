/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USUARIO_API_URL?: string
  readonly VITE_HOGAR_API_URL?: string
  readonly VITE_HOGAR_CUENTA_API_URL?: string
  readonly VITE_COMPROBANTE_API_URL?: string
  readonly VITE_NOTIFICACION_API_URL?: string
  readonly VITE_PUBLICACION_API_URL?: string
  readonly VITE_TAREA_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
