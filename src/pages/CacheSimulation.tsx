import { FC, useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw } from 'lucide-react';
import {
  LogEntry,
  useClientSimulation,
  SimulationServerCard,
  SimulationClientCard,
} from '@/components/simulation';

export const CacheSimulation: FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [serverLogs, setServerLogs] = useState<LogEntry[]>([]);

  const client1 = useClientSimulation({
    clientId: 'Klient_1',
    pollIntervalMs: 3000,
    isRunning,
  });

  const client2 = useClientSimulation({
    clientId: 'Klient_2',
    pollIntervalMs: 6000,
    isRunning,
  });

  // Logs listener for server
  useEffect(() => {
    if (!window.electronAPI?.onSimServerLog) return;
    const unsub = window.electronAPI.onSimServerLog((data) => {
      setServerLogs((prev) => [
        {
          id: Math.random().toString(),
          time: data.time,
          text: data.message,
          type: 'server',
        },
        ...prev.slice(0, 49),
      ]);
    });
    return () => {
      unsub && unsub();
    };
  }, []);

  const handleToggle = async () => {
    if (!window.electronAPI) return;

    if (!isRunning) {
      await Promise.all([client1.initCache(), client2.initCache()]);
      await window.electronAPI.simStart();
      setIsRunning(true);
    } else {
      await window.electronAPI.simStop();
      setIsRunning(false);
    }
  };

  const handleClearLogs = () => {
    setServerLogs([]);
    client1.clearLogs();
    client2.clearLogs();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Simulace zneplatnění keše serverem</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Klient se dotazuje na změny od časového razítka a zneplatňuje zastaralé položky. (Varianta 1)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isRunning ? 'destructive' : 'default'}
              size="sm"
              onClick={handleToggle}
              className="gap-1.5 font-medium"
            >
              {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Zastavit simulaci' : 'Spustit simulaci'}
            </Button>

            <Button variant="outline" size="sm" onClick={handleClearLogs} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Smazat logy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SimulationServerCard isRunning={isRunning} logs={serverLogs} />

          <SimulationClientCard
            title="Klient 1 (Polling 3s)"
            iconColor="text-cyan-500"
            updateColorClass="text-cyan-400"
            cache={client1.cache}
            logs={client1.logs}
          />

          <SimulationClientCard
            title="Klient 2 (Polling 6s)"
            iconColor="text-amber-500"
            updateColorClass="text-amber-400"
            cache={client2.cache}
            logs={client2.logs}
          />
        </div>
      </main>
    </div>
  );
};
