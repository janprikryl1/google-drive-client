import { FC } from 'react';
import { CacheItem } from './types';

interface SimulationCacheViewProps {
  cache: Map<string, CacheItem>;
}

export const SimulationCacheView: FC<SimulationCacheViewProps> = ({ cache }) => {
  return (
    <div className="text-xs bg-muted/50 p-2.5 rounded-lg border border-border">
      <div className="font-semibold text-muted-foreground mb-1.5">Obsah keše:</div>
      <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
        {Array.from(cache.values()).map((item) => (
          <div key={item.id} className="truncate text-foreground">
            {item.name} <span className="text-primary font-mono font-bold">v{item.version}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
