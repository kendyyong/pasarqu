/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  // tambahkan variabel lain di sini jika nanti ada
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}