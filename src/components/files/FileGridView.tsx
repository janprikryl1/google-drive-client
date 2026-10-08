import { FC, MouseEvent, useState, useEffect } from 'react';
import {
  CheckSquare,
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
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ExtendedDriveItem } from '@/types/DriveItem';
import { FileIcon } from './FileIcon';

type FileGridViewProps = {
  files: ExtendedDriveItem[];
  selectedIds: Set<string>;
  cachedFileIds: Set<string>;
  cachedFolderIds: Set<string>;
  effectiveOffline: boolean;
  onSelect: (id: string, e?: MouseEvent) => void;
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

export const FileGridView: FC<FileGridViewProps> = ({
  files,
  selectedIds,
  cachedFileIds,
  cachedFolderIds,
  effectiveOffline,
  onSelect,
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => {
        const isSelected = selectedIds.has(file.id);
        const isFolder = file.type === 'folder';
        const isCached = isFolder
          ? cachedFolderIds.has(file.id)
          : cachedFileIds.has(file.id);

        return (
          <Card
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
            className={`hover:border-primary hover:shadow-md transition-all cursor-pointer bg-card text-card-foreground border-border group relative ${
              isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                {/* Checkbox and File Icon */}
                <div className="flex items-center gap-2">
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
                  <FileIcon type={file.type} />
                </div>

                {/* Right actions: Cache indicator, Favorite star, Kebab menu */}
                <div className="flex items-center gap-1 relative">
                  {isCached && (
                    <span
                      title="Uloženo v offline keši"
                      className="text-emerald-500 p-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
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
                    <Star className={`h-3.5 w-3.5 ${file.starred ? 'fill-amber-400' : ''}`} />
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

                  {/* Context menu dropdown */}
                  {menuOpenId === file.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95"
                    >
                      {!isFolder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            setMenuOpenId(null);
                            onDownloadFile(file, e);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 text-primary" />
                          <span>Stáhnout</span>
                        </button>
                      )}

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

              <div>
                <div className="flex items-center gap-1.5">
                  <h3
                    className="font-medium text-sm text-card-foreground truncate group-hover:text-primary transition-colors flex-1"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  {file.isOfflineQueue && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-500 font-semibold shrink-0">
                      Offline
                    </span>
                  )}
                  {isCached && !file.isOfflineQueue && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-600 font-semibold shrink-0">
                      Kešováno
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{file.size || (isFolder ? 'Složka' : 'Dokument')}</span>
                  <span>{file.modified}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
