import { FC, MouseEvent, useState, useEffect } from 'react';
import {
  CheckSquare,
  MinusSquare,
  Square,
  Copy,
  Scissors,
  Edit3,
  CheckCircle2,
  HardDriveDownload,
  Download,
  ExternalLink,
  Star,
  Trash2,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { ExtendedDriveItem } from '@/types/DriveItem';
import { FileIcon } from './FileIcon';

type FileListViewProps = {
  files: ExtendedDriveItem[];
  selectedIds: Set<string>;
  cachedFileIds: Set<string>;
  cachedFolderIds: Set<string>;
  effectiveOffline: boolean;
  onSelect: (id: string, e?: MouseEvent) => void;
  onSelectAll: () => void;
  onOpenFolder: (folder: ExtendedDriveItem, e?: MouseEvent) => void;
  onDownloadFile: (file: ExtendedDriveItem, e?: MouseEvent) => void;
  onToggleCacheFile: (file: ExtendedDriveItem, e?: MouseEvent) => void;
  onToggleCacheFolder: (folder: ExtendedDriveItem, e?: MouseEvent) => void;
  onCopy: (items: ExtendedDriveItem[], e?: MouseEvent) => void;
  onCut: (items: ExtendedDriveItem[], e?: MouseEvent) => void;
  onRename: (file: ExtendedDriveItem, e?: MouseEvent) => void;
  onToggleStar: (id: string, starred: boolean, e: MouseEvent) => void;
  onDelete: (id: string, e: MouseEvent) => void;
};

export const FileListView: FC<FileListViewProps> = ({
  files,
  selectedIds,
  cachedFileIds,
  cachedFolderIds,
  effectiveOffline,
  onSelect,
  onSelectAll,
  onOpenFolder,
  onDownloadFile,
  onToggleCacheFile,
  onToggleCacheFolder,
  onCopy,
  onCut,
  onRename,
  onToggleStar,
  onDelete,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Close popup menu when clicking anywhere outside
  useEffect(() => {
    if (!menuOpenId) return;

    const handleOutsideClick = () => {
      setMenuOpenId(null);
    };

    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [menuOpenId]);

  const isAllSelected = files.length > 0 && selectedIds.size === files.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < files.length;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-xs">
      <div className="grid grid-cols-12 px-4 py-2.5 bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider items-center">
        <div className="col-span-1 flex items-center">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-muted-foreground hover:text-foreground"
            title={isAllSelected ? 'Odznačit vše' : 'Označit vše'}
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : isSomeSelected ? (
              <MinusSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="col-span-5 sm:col-span-4">Název</div>
        <div className="col-span-3 sm:col-span-3">Stav keše</div>
        <div className="hidden sm:block sm:col-span-2">Velikost / Upraveno</div>
        <div className="col-span-3 sm:col-span-2 text-right">Akce</div>
      </div>

      <div className="divide-y divide-border">
        {files.map((file) => {
          const isSelected = selectedIds.has(file.id);
          const isFolder = file.type === 'folder';
          const isCached = isFolder
            ? cachedFolderIds.has(file.id)
            : cachedFileIds.has(file.id);

          return (
            <div
              key={file.id}
              onClick={() => {
                if (isFolder) {
                  onOpenFolder(file);
                } else if (file.webViewLink && !effectiveOffline) {
                  window.open(file.webViewLink, '_blank');
                } else {
                  onDownloadFile(file);
                }
              }}
              className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/50 transition-colors group text-sm cursor-pointer ${
                isSelected ? 'bg-primary/5' : ''
              }`}
            >
              <div className="col-span-1 flex items-center">
                <button
                  type="button"
                  onClick={(e) => onSelect(file.id, e)}
                  className={`p-1 rounded-md transition-colors ${
                    isSelected
                      ? 'text-primary'
                      : 'text-muted-foreground/40 hover:text-muted-foreground'
                  }`}
                  title={isSelected ? 'Zrušit označení' : 'Označit položku'}
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="col-span-5 sm:col-span-4 flex items-center gap-3 truncate">
                <FileIcon type={file.type} className="h-5 w-5" />
                <span className="font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                  {file.name}
                </span>
              </div>

              <div className="col-span-3 sm:col-span-3 text-xs">
                {file.isOfflineQueue ? (
                  <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                    <Clock className="h-3 w-3" />
                    <span>Čeká na odeslání</span>
                  </span>
                ) : isCached ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Uloženo offline</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Pouze online</span>
                )}
              </div>

              <div className="hidden sm:block sm:col-span-2 text-xs text-muted-foreground">
                {file.size ? `${file.size} • ` : ''}
                {file.modified}
              </div>

              <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 relative">
                {!isFolder && (
                  <button
                    type="button"
                    onClick={(e) => onDownloadFile(file, e)}
                    className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted transition-colors"
                    title="Stáhnout do počítače"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => onToggleStar(file.id, Boolean(file.starred), e)}
                  className={`p-1 rounded-md hover:bg-muted transition-colors ${
                    file.starred
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/40 hover:text-muted-foreground'
                  }`}
                  title={file.starred ? 'Odebrat hvězdičku' : 'Přidat hvězdičku'}
                >
                  <Star className={`h-4 w-4 ${file.starred ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId((prev) => (prev === file.id ? null : file.id));
                  }}
                  className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                  title="Možnosti"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === file.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpenId(null);
                        if (isFolder) {
                          onToggleCacheFolder(file, e);
                        } else {
                          onToggleCacheFile(file, e);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      {isCached ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Odebrat z keše</span>
                        </>
                      ) : (
                        <>
                          <HardDriveDownload className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Uložit do keše</span>
                        </>
                      )}
                    </button>

                    <div className="h-px bg-border my-1" />

                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpenId(null);
                        onCopy([file], e);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Kopírovat</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpenId(null);
                        onCut([file], e);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Vyjmout</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpenId(null);
                        onRename(file, e);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Přejmenovat</span>
                    </button>

                    {file.webViewLink && !effectiveOffline && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Otevřít na Disku</span>
                      </a>
                    )}

                    <div className="h-px bg-border my-1" />

                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpenId(null);
                        onDelete(file.id, e);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-destructive/10 text-destructive text-left transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Smazat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
