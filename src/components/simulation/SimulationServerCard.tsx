import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Server as ServerIcon } from 'lucide-react';
import { LogEntry } from './types';
import { SimulationCard } from './SimulationCard';
import { SimulationLogViewer } from './SimulationLogViewer';

interface SimulationServerCardProps {
  isRunning: boolean;
  logs: LogEntry[];
}

export const SimulationServerCard: FC<SimulationServerCardProps> = ({ isRunning, logs }) => {
  return (
    <SimulationCard
      icon={<ServerIcon className="w-4 h-4 text-emerald-500" />}
      title="Server (Main proces)"
      badge={
        <Badge variant={isRunning ? 'default' : 'secondary'}>
          {isRunning ? 'Běží' : 'Neaktivní'}
        </Badge>
      }
    >
      <SimulationLogViewer
        logs={logs}
        emptyMessage="Čekání na spuštění simulace..."
        heightClass="h-[450px]"
      />
    </SimulationCard>
  );
};
