import { useState, useRef, useEffect, useCallback } from 'react';
import { CacheItem, LogEntry } from './types';

export type UseClientSimulationOptions = {
  clientId: string;
  pollIntervalMs: number;
  isRunning: boolean;
}

export function useClientSimulation({
  clientId,
  pollIntervalMs,
  isRunning,
}: UseClientSimulationOptions) {
  const [cache, setCache] = useState<Map<string, CacheItem>>(new Map());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastTs, setLastTs] = useState<number>(0);

  const stateRef = useRef({ cache, lastTs });
  stateRef.current = { cache, lastTs };

  const initCache = useCallback(async () => {
    if (!window.electronAPI?.simInitCache) return;
    const data = await window.electronAPI.simInitCache(clientId);
    const newCache = new Map<string, CacheItem>();
    data.forEach((item) =>
      newCache.set(item.id, { id: item.id, name: item.name, version: item.version })
    );
    setCache(newCache);
    setLastTs(Date.now());
    setLogs([
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        text: `Keš naplněna (${data.length} položek). Polling: ${pollIntervalMs / 1000}s`,
        type: 'info',
      },
    ]);
  }, [clientId, pollIntervalMs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!isRunning || !window.electronAPI) return;

    const interval = setInterval(async () => {
      const { cache: currentCache, lastTs: currentLastTs } = stateRef.current;
      const changes = await window.electronAPI!.simGetChanges(clientId, currentLastTs);
      const now = Date.now();
      setLastTs(now);

      if (!changes || changes.length === 0) return;

      const invalidated: string[] = [];
      const newLogs: LogEntry[] = [];

      for (const ch of changes) {
        const cached = currentCache.get(ch.id);
        if (cached && cached.version < ch.version) {
          invalidated.push(ch.id);
          newLogs.push({
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            text: `Zneplatněno: ${ch.name} (keš v${cached.version} < server v${ch.version})`,
            type: 'invalidate',
          });
        }
      }

      if (invalidated.length > 0) {
        const fresh = await window.electronAPI!.simGetRecords(invalidated);
        setCache((prev) => {
          const next = new Map(prev);
          fresh.forEach((f) => {
            next.set(f.id, { id: f.id, name: f.name, version: f.version });
          });
          return next;
        });

        newLogs.push({
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          text: `Aktualizováno zneplatněných položek: ${fresh.length}`,
          type: 'update',
        });
      }

      setLogs((prev) => [...newLogs, ...prev.slice(0, 40)]);
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [isRunning, clientId, pollIntervalMs]);

  return {
    cache,
    logs,
    initCache,
    clearLogs,
  };
}
