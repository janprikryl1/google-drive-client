import { FC } from 'react';
import { LogEntry } from './types';

interface SimulationLogViewerProps {
  logs: LogEntry[];
  emptyMessage?: string;
  heightClass?: string;
  updateColorClass?: string;
}

export const SimulationLogViewer: FC<SimulationLogViewerProps> = ({
  logs,
  emptyMessage = 'Žádné události...',
  heightClass = 'h-[310px]',
  updateColorClass = 'text-cyan-400',
}) => {
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'server':
        return 'text-emerald-400';
      case 'invalidate':
        return 'text-rose-400 font-semibold';
      case 'update':
        return updateColorClass;
      case 'info':
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div
      className={`text-xs font-mono bg-zinc-950 text-zinc-100 p-3 rounded-lg overflow-y-auto space-y-1.5 ${heightClass}`}
    >
      {logs.length === 0 ? (
        <div className="text-zinc-500 italic">{emptyMessage}</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className={getLogColor(log.type)}>
            <span className="text-zinc-500">[{log.time}]</span> {log.text}
          </div>
        ))
      )}
    </div>
  );
};
