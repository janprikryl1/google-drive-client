import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Smartphone } from 'lucide-react';
import { CacheItem, LogEntry } from './types';
import { SimulationCard } from './SimulationCard';
import { SimulationCacheView } from './SimulationCacheView';
import { SimulationLogViewer } from './SimulationLogViewer';

interface SimulationClientCardProps {
  title: string;
  iconColor: string;
  updateColorClass: string;
  cache: Map<string, CacheItem>;
  logs: LogEntry[];
}

export const SimulationClientCard: FC<SimulationClientCardProps> = ({
  title,
  iconColor,
  updateColorClass,
  cache,
  logs,
}) => {
  return (
    <SimulationCard
      icon={<Smartphone className={`w-4 h-4 ${iconColor}`} />}
      title={title}
      badge={<Badge variant="outline">{cache.size} v keši</Badge>}
    >
      <SimulationCacheView cache={cache} />
      <SimulationLogViewer
        logs={logs}
        emptyMessage="Žádné události..."
        heightClass="h-[310px]"
        updateColorClass={updateColorClass}
      />
    </SimulationCard>
  );
};
