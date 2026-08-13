/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BAIDU_MAP_AK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
