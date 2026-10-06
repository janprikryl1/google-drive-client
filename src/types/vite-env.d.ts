/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ClientID?: string;
  readonly ClientSecret?: string;
  readonly RootFolderName?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_CLIENT_SECRET?: string;
  readonly VITE_ROOT_FOLDER_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
