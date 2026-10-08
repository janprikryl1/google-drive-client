import { FC } from 'react';
import { Copy, Download, Scissors, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExtendedDriveItem } from '@/types/DriveItem';

type FileSelectionBarProps = {
  selectedCount: number;
  selectedItems: ExtendedDriveItem[];
  isDownloading: boolean;
  onClearSelection: () => void;
  onCopy: (items: ExtendedDriveItem[]) => void;
  onCut: (items: ExtendedDriveItem[]) => void;
  onDownload: () => void;
  onDelete: () => void;
};

export const FileSelectionBar: FC<FileSelectionBarProps> = ({
  selectedCount,
  selectedItems,
  isDownloading,
  onClearSelection,
  onCopy,
  onCut,
  onDownload,
  onDelete,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 px-4 bg-primary/10 border border-primary/20 rounded-xl text-xs transition-all">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-primary">
          Vybráno: {selectedCount}{' '}
          {selectedCount === 1
            ? 'položka'
            : selectedCount < 5
            ? 'položky'
            : 'položek'}
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground text-[11px] underline ml-2"
        >
          Zrušit výběr
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(selectedItems)}
          className="h-8 gap-1 text-xs border-input text-foreground"
          title="Kopírovat označené"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Kopírovat</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onCut(selectedItems)}
          className="h-8 gap-1 text-xs border-input text-foreground"
          title="Vyjmout (přesunout) označené"
        >
          <Scissors className="h-3.5 w-3.5" />
          <span>Vyjmout</span>
        </Button>

        <Button
          size="sm"
          onClick={onDownload}
          disabled={isDownloading}
          className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
        >
          <Download className={`h-3.5 w-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
          <span>{isDownloading ? 'Stahuji...' : 'Stáhnout'}</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          title="Smazat označené položky"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Smazat</span>
        </Button>
      </div>
    </div>
  );
};
