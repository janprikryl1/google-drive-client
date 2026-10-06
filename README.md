# Google Drive Client (Electron + React + TypeScript)

Tento projekt kombinuje **Electron**, **React** a **Vite** kompletně postavený v **TypeScriptu**.

## 📁 Struktura projektu

```text
google-drive-client/
├── src/
│   ├── main/                 # Electron hlavní proces a preload skripty
│   │   ├── main.ts           # Vytvoření okna, životní cyklus aplikace, IPC handlery
│   │   └── preload.ts        # Bezpečný IPC bridge přes contextBridge
│   ├── renderer/             # React uživatelské rozhraní
│   │   ├── App.tsx           # Hlavní komponenta (Google Drive UI)
│   │   ├── App.css           # Styly komponenty
│   │   ├── index.css         # Globální styly
│   │   └── main.tsx          # Vstupní bod React aplikace
│   └── types/                # TypeScript deklarace
│       ├── electron.d.ts     # Typování Window.electronAPI
│       └── vite-env.d.ts     # Vite typy pro importy CSS a assetů
├── dist/                     # Výstup buildu pro React (Vite)
├── dist-electron/            # Výstup buildu pro Electron hlavní proces (tsc)
├── index.html                # Vstupní HTML šablona pro Vite
├── vite.config.mts           # Konfigurace Vite bundleru
├── tsconfig.json             # TypeScript konfigurace pro React (Renderer)
├── tsconfig.electron.json    # TypeScript konfigurace pro Electron (Main & Preload)
└── package.json              # Nastavení projektu a skripty
```

## 🚀 Spuštění a vývoj

### Vývojový režim (Live HMR + Electron)
```bash
npm run dev
# nebo
npm start
```
Spustí Vite dev server na `http://localhost:5173` a po naběhnutí automaticky spustí Electron okno s hot-reloadem pro React.

### Samostatné spuštění pouze React rozhraní v prohlížeči
```bash
npm run dev:renderer
```

### Produkční build
```bash
npm run build
```
Zkompiluje TypeScript jak pro Electron (`dist-electron/`), tak pro React renderer (`dist/`).

### Zabalení instalačního balíčku (electron-builder)
```bash
npm run package
```
Vytvoří spustitelnou distribuci aplikace do složky `release/`.

## 🔒 Bezpečnost a IPC komunikace
- `nodeIntegration: false` a `contextIsolation: true` zajišťují bezpečné oddělení DOMu od systémových Node.js API.
- Komunikace mezi Reactem a hlavním procesem probíhá typovaně přes `preload.ts` a `window.electronAPI`.
# google-drive-client
