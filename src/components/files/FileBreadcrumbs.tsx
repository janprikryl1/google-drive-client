import { FC } from 'react';
import {
  ArrowUp,
  ChevronRight,
  FolderPlus,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreadcrumbItem } from '@/types/DriveItem';

type FileBreadcrumbsProps = {
  breadcrumbs: BreadcrumbItem[];
  rootFolderName: string;
  isUploading: boolean;
  isCheckingFreshness: boolean;
  effectiveOffline: boolean;
  onNavigateBreadcrumb: (index: number) => void;
  onNavigateUp: () => void;
  onCheckCache: () => void;
  onUploadClick: () => void;
  onOpenFolderModal: () => void;
};

export const FileBreadcrumbs: FC<FileBreadcrumbsProps> = ({
  breadcrumbs,
  rootFolderName,
  isUploading,
  isCheckingFreshness,
  effectiveOffline,
  onNavigateBreadcrumb,
  onNavigateUp,
  onCheckCache,
  onUploadClick,
  onOpenFolderModal,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-xs">
      {/* Breadcrumbs trail */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        {breadcrumbs.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={breadcrumbs.length <= 1}
            onClick={onNavigateUp}
            className="h-8 px-2.5 text-muted-foreground hover:text-foreground disabled:opacity-30 gap-1 rounded-lg"
            title="Přejít o úroveň výš"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <p>Nahoru</p>
          </Button>
        )}

        <div className="h-4 w-px bg-border mx-1" />

        {breadcrumbs.length > 0 ? (
          breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.id || idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <button
                  type="button"
                  onClick={() => onNavigateBreadcrumb(idx)}
                  className={`px-2 py-1 rounded-md transition-colors text-xs ${
                    isLast
                      ? 'font-bold text-foreground bg-muted pointer-events-none'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted font-medium'
                  }`}
                >
                  {idx === 0 ? `/${crumb.name}` : crumb.name}
                </button>
              </div>
            );
          })
        ) : (
          <span className="font-semibold text-card-foreground">/{rootFolderName}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={onCheckCache}
          disabled={isCheckingFreshness || effectiveOffline}
          className="border-input text-foreground text-xs gap-1.5 h-8 rounded-lg"
          title="Zkontrolovat aktuálnost keše vůči serveru"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCheckingFreshness ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Zkontrolovat keš</span>
        </Button>

        <Button
          size="sm"
          onClick={onUploadClick}
          disabled={isUploading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 h-8 rounded-lg shadow-xs"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          <span>{isUploading ? 'Nahrávám...' : 'Nahrát soubor'}</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenFolderModal}
          className="border-input text-foreground text-xs gap-1.5 h-8 rounded-lg"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span>Nová složka</span>
        </Button>
      </div>
    </div>
  );
};
