import { ipcMain, BrowserWindow } from 'electron';
import { SimRecord } from './types/SimRecord';
import { SimChange } from './types/SimChange';

class CacheServerSimulator {
  private records = new Map<string, SimRecord>();
  private changes: SimChange[] = [];
  private clientCaches = new Map<string, Set<string>>();
  private updateTimer: NodeJS.Timeout | null = null;
  private readonly getWindow: () => BrowserWindow | null;

  constructor(getWindow: () => BrowserWindow | null) {
    this.getWindow = getWindow;
    this.resetDatabase();
  }

  private initRecords() {
    const now = Date.now();
    for (let i = 1; i <= 8; i++) {
      const id = `doc_${i}`;
      this.records.set(id, {
        id,
        name: `Dokument_${i}.docx`,
        version: 1,
        updatedAt: now,
      });
    }
  }

  private resetDatabase() {
    this.records.clear();
    this.changes = [];
    this.initRecords();
  }

  public start() {
    if (this.updateTimer) return;
    this.logToRenderer('Serverová smyčka spuštěna (náhodné změny 1.5–3.5s)');

    const scheduleNext = () => {
      const delay = 1500 + Math.random() * 2000;
      this.updateTimer = setTimeout(() => {
        this.performRandomUpdate();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  public stop() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
      this.logToRenderer('Serverová smyčka zastavena');
    }
  }

  private performRandomUpdate() {
    const keys = Array.from(this.records.keys());
    if (keys.length === 0) return;

    // 1 or 2 random records
    const count = Math.random() > 0.5 ? 2 : 1;
    const shuffled = [...keys].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count);
    const now = Date.now();

    for (const rid of picked) {
      const rec = this.records.get(rid)!;
      rec.version += 1;
      rec.updatedAt = now;

      const change: SimChange = {
        id: rid,
        name: rec.name,
        version: rec.version,
        timestamp: now,
      };
      this.changes.push(change);
      this.logToRenderer(`Změna na serveru: ${rec.name} -> nová verze v${rec.version}`);
    }
  }

  public registerClientCache(clientId: string, ids: string[]): SimRecord[] {
    this.clientCaches.set(clientId, new Set(ids));
    return Array.from(this.records.values());
  }

  public getChangesSince(clientId: string, sinceTimestamp: number): SimChange[] {
    const cachedIds = this.clientCaches.get(clientId) || new Set();
    return this.changes.filter(
      (ch) => ch.timestamp > sinceTimestamp && cachedIds.has(ch.id)
    );
  }

  public getRecordsByIds(ids: string[]): SimRecord[] {
    return ids.map((id) => this.records.get(id)).filter(Boolean) as SimRecord[];
  }

  private logToRenderer(message: string) {
    const win = this.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('sim:server-log', {
        time: new Date().toLocaleTimeString(),
        message,
      });
    }
  }
}

export function registerSimulationIpc(getWindow: () => BrowserWindow | null) {
  const simulator = new CacheServerSimulator(getWindow);

  ipcMain.handle('sim:start', () => {
    simulator.start();
    return { ok: true };
  });

  ipcMain.handle('sim:stop', () => {
    simulator.stop();
    return { ok: true };
  });

  ipcMain.handle('sim:init-cache', (_event, clientId: string) => {
    const records = Array.from(simulator['records'].keys());
    return simulator.registerClientCache(clientId, records);
  });

  ipcMain.handle('sim:get-changes', (_event, { clientId, sinceTimestamp }: { clientId: string; sinceTimestamp: number }) => {
    return simulator.getChangesSince(clientId, sinceTimestamp);
  });

  ipcMain.handle('sim:get-records', (_event, ids: string[]) => {
    return simulator.getRecordsByIds(ids);
  });
}
