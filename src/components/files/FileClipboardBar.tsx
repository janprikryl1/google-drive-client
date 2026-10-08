import { FC } from 'react';
import { ClipboardPaste, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipboardState } from '@/types/DriveItem';

type FileClipboardBarProps = {
  clipboard: ClipboardState;
  isProcessingPaste: boolean;
  effectiveOffline: boolean;
  onPaste: () => void;
  onClear: () => void;
};

export const FileClipboardBar: FC<FileClipboardBarProps> = ({
  clipboard,
  isProcessingPaste,
  effectiveOffline,
  onPaste,
  onClear,
}) => {
  if (!clipboard) return null;

  return (
    <div className="p-3 px-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
      <div className="flex items-center gap-2">
        <ClipboardPaste className="h-4 w-4 text-primary" />
        <span className="font-medium text-card-foreground">
          Ve schránce: <strong>{clipboard.items.length}</strong>{' '}
          {clipboard.items.length === 1 ? 'položka' : 'položek'} k{' '}
          <strong>{clipboard.action === 'copy' ? 'zkopírování' : 'přesunu'}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onPaste}
          disabled={isProcessingPaste || effectiveOffline}
          className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-xs"
        >
          {isProcessingPaste ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ClipboardPaste className="h-3.5 w-3.5" />
          )}
          <span>Vložit sem</span>
        </Button>
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          title="Zrušit schránku"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
