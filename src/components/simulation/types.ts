export interface CacheItem {
  id: string;
  name: string;
  version: number;
}

export type LogType = 'server' | 'invalidate' | 'update' | 'info';

export interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: LogType;
}
