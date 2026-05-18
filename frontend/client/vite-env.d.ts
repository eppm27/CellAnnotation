/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  // Add more env variables here, ensuring they are prefixed with VITE_
  // For example:
  // readonly VITE_ANOTHER_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
