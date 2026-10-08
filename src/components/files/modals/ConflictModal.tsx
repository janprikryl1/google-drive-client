import { FC } from 'react';
import { AlertTriangle, Clock, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConflictItem } from '@/lib/offlineStorage';
import { OperationConflict } from '@/types/DriveItem';

type ConflictModalProps = {
  offlineConflict: ConflictItem | null;
  operationConflict: OperationConflict | null;
  onResolveOffline: (choice: 'client' | 'server') => void;
  onResolveOperation: (choice: 'overwrite' | 'keep_both' | 'cancel') => void;
};

export const ConflictModal: FC<ConflictModalProps> = ({
  offlineConflict,
  operationConflict,
  onResolveOffline,
  onResolveOperation,
}) => {
  // 1. Offline Upload Conflict
  if (offlineConflict) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-card-foreground">Detekován konflikt souboru</h3>
              <p className="text-xs text-muted-foreground">
                Soubor „{offlineConflict.queueItem.name}“ byl upraven i na serveru.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">Vyberte, kterou verzi chcete zachovat.</p>

            {/* Server version card */}
            <div className="p-3 bg-muted rounded-xl border border-border space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                <span>Verze na serveru (Google Disk)</span>
              </div>
              <div className="text-muted-foreground text-[11px] pl-5">
                Poslední změna:{' '}
                {new Date(offlineConflict.serverFile.modifiedTime).toLocaleString('cs-CZ')}
              </div>
            </div>

            {/* Client version card */}
            <div className="p-3 bg-muted rounded-xl border border-border space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Verze z klienta (offline nahráno)</span>
              </div>
              <div className="text-muted-foreground text-[11px] pl-5">
                Velikost: {(offlineConflict.queueItem.size / 1024).toFixed(0)} KB • Vytvořeno:{' '}
                {new Date(offlineConflict.queueItem.createdAt).toLocaleString('cs-CZ')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onResolveOffline('server')}
              className="flex-1 text-xs border-input text-foreground h-9"
            >
              Použít soubor ze serveru
            </Button>
            <Button
              type="button"
              onClick={() => onResolveOffline('client')}
              className="flex-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9"
            >
              Použít soubor z klienta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Operation Conflict (Paste / Rename)
  if (operationConflict) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-card-foreground">Konflikt názvu položky</h3>
              <p className="text-xs text-muted-foreground">
                Položka s názvem „{operationConflict.existingItemName}“ již v této složce existuje.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Jak si přejete vzniklý konflikt vyřešit?
          </p>

          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {operationConflict.type === 'paste' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onResolveOperation('keep_both')}
                className="text-xs border-input text-foreground justify-start h-9"
              >
                Zachovat obě (vytvořit jako „Kopie - {operationConflict.item.name}“)
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onResolveOperation('overwrite')}
              className="text-xs border-input text-destructive hover:bg-destructive/10 justify-start h-9"
            >
              Přepsat stávající položku
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onResolveOperation('cancel')}
              className="text-xs text-muted-foreground justify-start h-8"
            >
              Zrušit operaci
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
