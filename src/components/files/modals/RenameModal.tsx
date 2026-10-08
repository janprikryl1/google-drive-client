import { FC, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExtendedDriveItem } from '@/types/DriveItem';

type RenameModalProps = {
  item: ExtendedDriveItem | null;
  newName: string;
  isRenaming: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
};

export const RenameModal: FC<RenameModalProps> = ({
  item,
  newName,
  isRenaming,
  onNameChange,
  onSubmit,
  onClose,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-card text-card-foreground rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-base text-card-foreground">Přejmenovat položku</h3>
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {item.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-card-foreground">Nový název:</label>
            <Input
              type="text"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
              className="bg-background border-input text-foreground"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-input text-foreground"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isRenaming}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isRenaming ? 'Ukládám...' : 'Přejmenovat'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
