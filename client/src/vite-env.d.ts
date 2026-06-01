/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API base URL (e.g. https://host/api). Falls back to "/api" in dev. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
