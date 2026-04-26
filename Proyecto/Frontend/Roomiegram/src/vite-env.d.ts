/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL?: string
  readonly VITE_HOGAR_API_URL?: string
  readonly VITE_PUBLICACION_API_URL?: string
  readonly VITE_TAREA_API_URL?: string
  readonly VITE_HOGAR_CUENTA_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}