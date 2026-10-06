import {
  FC,
  useState,
  useEffect,
  useCallback,
  useRef,
  MouseEvent,
  FormEvent,
  ChangeEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Upload,
  Download,
  Search,
  RefreshCw,
  Home as HomeIcon,
  LogIn,
  LayoutGrid,
  List,
  X,
  LogOut,
  ExternalLink,
  Star,
  Trash2,
  FolderPlus,
  AlertCircle,
  FolderTree,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  ArrowUp,
  Wifi,
  WifiOff,
  HardDrive,
  HardDriveDownload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DriveItem } from '../types/DriveItem';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  saveFileToCache,
  getFileFromCache,
  removeFileFromCache,
  getAllCachedFiles,
  getCachedFilesByFolder,
  saveFolderToCache,
  removeFolderFromCache,
  getAllCachedFolders,
  addOfflineUpload,
  getOfflineUploads,
  removeOfflineUpload,
  type OfflineUploadItem,
  type ConflictItem,
} from '@/lib/offlineStorage';

export const ROOT_FOLDER_NAME =
  import.meta.env.VITE_ROOT_FOLDER_NAME ||
  import.meta.env.RootFolderName ||
  'mobilni_systemy';

type ExtendedDriveItem = DriveItem & {
  starred?: boolean;
  mimeType?: string;
  webViewLink?: string;
  modifiedTimeRaw?: string;
  isOfflineQueue?: boolean;
};

type BreadcrumbItem = {
  id: string;
  name: string;
};

export const Files: FC = () => {
  const { token, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [files, setFiles] = useState<ExtendedDriveItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [folderNotFound, setFolderNotFound] = useState<boolean>(false);
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState<boolean>(false);

  // Connectivity and simulated offline
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const effectiveOffline = !isOnline || isSimulatedOffline;

  // Cache & sync state
  const [cachedFileIds, setCachedFileIds] = useState<Set<string>>(new Set());
  const [cachedFolderIds, setCachedFolderIds] = useState<Set<string>>(new Set());
  const [offlineQueue, setOfflineQueue] = useState<OfflineUploadItem[]>([]);
  const [isCheckingFreshness, setIsCheckingFreshness] = useState<boolean>(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const [conflictModalItem, setConflictModalItem] = useState<ConflictItem | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Folder creation modal state (only for folder name)
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isSavingFolder, setIsSavingFolder] = useState<boolean>(false);

  const currentFolder =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1]
      : rootFolderId
      ? { id: rootFolderId, name: ROOT_FOLDER_NAME }
      : null;

  // Refresh cache status from IndexedDB
  const refreshCacheStatus = useCallback(async () => {
    try {
      const allFiles = await getAllCachedFiles();
      setCachedFileIds(new Set(allFiles.map((f) => f.id)));
      const allFolders = await getAllCachedFolders();
      setCachedFolderIds(new Set(allFolders.map((f) => f.id)));
      const queue = await getOfflineUploads();
      setOfflineQueue(queue);
    } catch (err) {
      console.warn('Chyba při čtení IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    refreshCacheStatus();
  }, [refreshCacheStatus]);

  // Network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch files located inside a specific folder ID (handles both online & offline)
  const fetchFilesInFolder = useCallback(
    async (folderId: string) => {
      setIsLoadingFiles(true);

      // OFFLINE MODE: Load items directly from IndexedDB
      if (effectiveOffline) {
        try {
          const cachedItems = await getCachedFilesByFolder(folderId);
          const queue = await getOfflineUploads();
          const folderQueue = queue.filter((q) => q.folderId === folderId);

          const offlineList: ExtendedDriveItem[] = [
            ...folderQueue.map((q) => ({
              id: q.queueId,
              name: q.name,
              type: q.mimeType.startsWith('image/')
                ? ('image' as const)
                : q.name.endsWith('.xlsx') || q.name.endsWith('.csv')
                ? ('spreadsheet' as const)
                : ('document' as const),
              size: `${(q.size / 1024).toFixed(0)} KB`,
              modified: 'Čeká na synchronizaci',
              mimeType: q.mimeType,
              isOfflineQueue: true,
            })),
            ...cachedItems
              .filter((c) => !folderQueue.some((q) => q.queueId === c.id))
              .map((c) => ({
                id: c.id,
                name: c.name,
                type: c.mimeType === 'application/vnd.google-apps.folder'
                  ? ('folder' as const)
                  : c.mimeType.startsWith('image/')
                  ? ('image' as const)
                  : c.name.endsWith('.xlsx') || c.name.endsWith('.csv')
                  ? ('spreadsheet' as const)
                  : ('document' as const),
                size: `${(c.size / 1024).toFixed(0)} KB`,
                modified: new Date(c.cachedAt).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'short',
                }),
                mimeType: c.mimeType,
              })),
          ];

          setFiles(offlineList);
        } catch (err) {
          console.error('Chyba při čtení lokální keše:', err);
        } finally {
          setIsLoadingFiles(false);
        }
        return;
      }

      // ONLINE MODE: Fetch from Google Drive API
      if (!token) {
        setIsLoadingFiles(false);
        return;
      }

      try {
        const filesQuery = `'${folderId}' in parents and trashed = false`;
        const filesRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            filesQuery
          )}&pageSize=100&fields=files(id,name,mimeType,size,modifiedTime,starred,webViewLink)&orderBy=folder,name`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (filesRes.ok) {
          const filesData = await filesRes.json();
          const queue = await getOfflineUploads();
          const folderQueue = queue.filter((q) => q.folderId === folderId);

          const parsedFiles: ExtendedDriveItem[] = [
            ...folderQueue.map((q) => ({
              id: q.queueId,
              name: q.name,
              type: q.mimeType.startsWith('image/')
                ? ('image' as const)
                : q.name.endsWith('.xlsx') || q.name.endsWith('.csv')
                ? ('spreadsheet' as const)
                : ('document' as const),
              size: `${(q.size / 1024).toFixed(0)} KB`,
              modified: 'Čeká na odeslání',
              mimeType: q.mimeType,
              isOfflineQueue: true,
            })),
            ...(filesData.files || []).map((f: any) => {
              let itemType: DriveItem['type'] = 'document';
              if (f.mimeType === 'application/vnd.google-apps.folder') {
                itemType = 'folder';
              } else if (
                f.mimeType?.includes('spreadsheet') ||
                f.name.endsWith('.xlsx') ||
                f.name.endsWith('.csv')
              ) {
                itemType = 'spreadsheet';
              } else if (
                f.mimeType?.startsWith('image/') ||
                f.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)
              ) {
                itemType = 'image';
              }

              let formattedSize: string | undefined;
              if (f.size) {
                const bytes = parseInt(f.size, 10);
                if (bytes < 1024 * 1024) {
                  formattedSize = `${(bytes / 1024).toFixed(0)} KB`;
                } else {
                  formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                }
              }

              let formattedDate = 'neznámo';
              if (f.modifiedTime) {
                formattedDate = new Date(f.modifiedTime).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'short',
                });
              }

              return {
                id: f.id,
                name: f.name,
                type: itemType,
                size: formattedSize,
                modified: formattedDate,
                modifiedTimeRaw: f.modifiedTime,
                starred: Boolean(f.starred),
                mimeType: f.mimeType,
                webViewLink: f.webViewLink,
              };
            }),
          ];

          setFiles(parsedFiles);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [token, effectiveOffline]
  );

  // Initialize root folder and files
  const loadRootAndFiles = useCallback(async () => {
    if (effectiveOffline) {
      // In offline mode, assume root folder and load cached items
      const mockRootId = rootFolderId || 'offline_root';
      setRootFolderId(mockRootId);
      setBreadcrumbs([{ id: mockRootId, name: ROOT_FOLDER_NAME }]);
      await fetchFilesInFolder(mockRootId);
      return;
    }

    if (!token) {
      setFiles([]);
      setBreadcrumbs([]);
      return;
    }

    setIsLoadingFiles(true);
    setFolderNotFound(false);

    try {
      const folderQuery = `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          folderQuery
        )}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!searchRes.ok) {
        throw new Error('Chyba při vyhledávání složky na Google Disku');
      }

      const searchData = await searchRes.json();
      const targetFolder = searchData.files && searchData.files[0];

      if (!targetFolder) {
        setRootFolderId(null);
        setBreadcrumbs([]);
        setFolderNotFound(true);
        setFiles([]);
        return;
      }

      const folderId = targetFolder.id;
      setRootFolderId(folderId);
      setBreadcrumbs([{ id: folderId, name: ROOT_FOLDER_NAME }]);
      await fetchFilesInFolder(folderId);
    } catch (err) {
      console.error('Error finding root folder:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [token, effectiveOffline, rootFolderId, fetchFilesInFolder]);

  useEffect(() => {
    loadRootAndFiles();
  }, [loadRootAndFiles]);

  // Navigate into clicked folder
  const handleOpenFolder = (folder: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedIds(new Set());
    setSearchQuery('');
    fetchFilesInFolder(folder.id);
  };

  // Navigate to an ancestor breadcrumb level
  const handleNavigateBreadcrumb = (index: number) => {
    if (index === breadcrumbs.length - 1) return;
    const targetCrumb = breadcrumbs[index];
    const updatedBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(updatedBreadcrumbs);
    setSelectedIds(new Set());
    setSearchQuery('');
    if (targetCrumb.id) {
      fetchFilesInFolder(targetCrumb.id);
    }
  };

  const handleNavigateUp = () => {
    if (breadcrumbs.length <= 1) return;
    handleNavigateBreadcrumb(breadcrumbs.length - 2);
  };

  // Create root folder if missing
  const handleCreateRootFolder = async () => {
    if (!token || effectiveOffline) return;
    setIsCreatingRootFolder(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ROOT_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (res.ok) {
        await loadRootAndFiles();
      }
    } catch (err) {
      console.error('Chyba při vytváření kořenové složky:', err);
    } finally {
      setIsCreatingRootFolder(false);
    }
  };

  // ==========================================
  // BOD 3: KEŠOVÁNÍ SOUBORŮ & SLOŽEK, KONTROLA
  // ==========================================

  // Toggle caching for a file
  const handleToggleCacheFile = async (file: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (file.type === 'folder') return;

    const isCached = cachedFileIds.has(file.id);

    if (isCached) {
      // Remove from cache
      await removeFileFromCache(file.id);
      await refreshCacheStatus();
      return;
    }

    if (!token) {
      alert('Pro stažení do keše se musíte nejprve přihlásit.');
      return;
    }

    if (effectiveOffline) {
      alert('Pro první stažení souboru do offline keše musíte mít připojení k serveru.');
      return;
    }

    try {
      let downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      if (file.mimeType?.startsWith('application/vnd.google-apps.')) {
        if (file.mimeType.includes('spreadsheet')) {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
        } else {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
        }
      }

      const res = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Chyba při stahování souboru pro keš');
      }

      const blob = await res.blob();
      const folderId = currentFolder?.id || rootFolderId || 'root';

      await saveFileToCache({
        id: file.id,
        name: file.name,
        folderId,
        mimeType: file.mimeType || 'application/octet-stream',
        size: blob.size,
        modifiedTime: file.modifiedTimeRaw || new Date().toISOString(),
        cachedAt: Date.now(),
        blob,
      });

      await refreshCacheStatus();
    } catch (err) {
      console.error('Chyba při kešování souboru:', err);
      alert(`Nepodařilo se uložit soubor "${file.name}" do keše.`);
    }
  };

  // Toggle caching for an entire folder
  const handleToggleCacheFolder = async (folder: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const isCached = cachedFolderIds.has(folder.id);

    if (isCached) {
      await removeFolderFromCache(folder.id);
      await refreshCacheStatus();
      return;
    }

    if (effectiveOffline) {
      alert('Pro kešování složky musíte být online.');
      return;
    }

    try {
      await saveFolderToCache({
        id: folder.id,
        name: folder.name,
        cachedAt: Date.now(),
      });

      // Also cache all files inside this folder
      const filesQuery = `'${folder.id}' in parents and trashed = false`;
      const filesRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          filesQuery
        )}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (filesRes.ok) {
        const data = await filesRes.json();
        for (const f of data.files || []) {
          if (f.mimeType !== 'application/vnd.google-apps.folder') {
            try {
              let dlUrl = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
              if (f.mimeType?.startsWith('application/vnd.google-apps.')) {
                dlUrl = `https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=application/pdf`;
              }
              const dlRes = await fetch(dlUrl, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (dlRes.ok) {
                const blob = await dlRes.blob();
                await saveFileToCache({
                  id: f.id,
                  name: f.name,
                  folderId: folder.id,
                  mimeType: f.mimeType,
                  size: blob.size,
                  modifiedTime: f.modifiedTime,
                  cachedAt: Date.now(),
                  blob,
                });
              }
            } catch {
              // continue next file
            }
          }
        }
      }

      await refreshCacheStatus();
    } catch (err) {
      console.error('Chyba při kešování složky:', err);
    }
  };

  // Kontrola aktuálnosti a aktualizace keše v době připojení na server
  const handleCheckCacheFreshness = async () => {
    if (effectiveOffline) {
      alert('Pro kontrolu aktuálnosti keše musíte být připojeni k serveru.');
      return;
    }
    if (!token) return;

    setIsCheckingFreshness(true);
    try {
      const allCached = await getAllCachedFiles();
      if (allCached.length === 0) {
        alert('V lokální keši zatím nemáte žádné soubory.');
        return;
      }

      let updatedCount = 0;
      let upToDateCount = 0;
      let removedCount = 0;

      for (const cached of allCached) {
        try {
          const checkRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${cached.id}?fields=id,name,modifiedTime,trashed`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!checkRes.ok) {
            if (checkRes.status === 404) {
              await removeFileFromCache(cached.id);
              removedCount++;
            }
            continue;
          }

          const serverData = await checkRes.json();
          if (serverData.trashed) {
            await removeFileFromCache(cached.id);
            removedCount++;
            continue;
          }

          const serverTime = new Date(serverData.modifiedTime).getTime();
          const cachedTime = new Date(cached.modifiedTime).getTime();

          if (serverTime > cachedTime) {
            // Server version is newer - download update into cache!
            let dlUrl = `https://www.googleapis.com/drive/v3/files/${cached.id}?alt=media`;
            if (cached.mimeType.startsWith('application/vnd.google-apps.')) {
              dlUrl = `https://www.googleapis.com/drive/v3/files/${cached.id}/export?mimeType=application/pdf`;
            }

            const dlRes = await fetch(dlUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (dlRes.ok) {
              const newBlob = await dlRes.blob();
              await saveFileToCache({
                ...cached,
                modifiedTime: serverData.modifiedTime,
                cachedAt: Date.now(),
                blob: newBlob,
                size: newBlob.size,
              });
              updatedCount++;
            }
          } else {
            upToDateCount++;
          }
        } catch (err) {
          console.warn(`Nepodařilo se ověřit ${cached.name}:`, err);
        }
      }

      await refreshCacheStatus();
      alert(
        `Kontrola keše dokončena:\n• ${updatedCount} souborů aktualizováno z novější verze na serveru\n• ${upToDateCount} souborů je aktuálních${
          removedCount > 0 ? `\n• ${removedCount} smazaných souborů odebráno` : ''
        }`
      );
    } catch (err) {
      console.error('Chyba při kontrole keše:', err);
      alert('Při kontrole aktuálnosti keše došlo k chybě.');
    } finally {
      setIsCheckingFreshness(false);
    }
  };

  // ==========================================
  // BOD 4: OFFLINE UPLOAD, SYNC & KONFLIKTY
  // ==========================================

  // Upload item to Google Drive via multipart
  const uploadFileToServer = async (name: string, folderId: string, mimeType: string, blob: Blob) => {
    const metadata = {
      name,
      parents: [folderId],
    };
    const boundary = `-------upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataBlob = new Blob(
      [
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
      ],
      { type: 'text/plain' }
    );
    const closingBlob = new Blob([closeDelimiter], { type: 'text/plain' });
    const multipartBody = new Blob([metadataBlob, blob, closingBlob]);

    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });
  };

  // Synchronize offline upload queue to server with conflict detection
  const handleSyncOfflineQueue = async () => {
    if (effectiveOffline) {
      alert('Pro synchronizaci odchozí fronty musíte být online.');
      return;
    }
    if (!token) return;

    const queue = await getOfflineUploads();
    if (queue.length === 0) {
      alert('Ve frontě offline nahrávání nejsou žádné soubory.');
      return;
    }

    setIsSyncingQueue(true);

    for (const item of queue) {
      try {
        // Check if file with same name already exists in target folder on server
        const escapedName = item.name.replace(/'/g, "\\'");
        const checkRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            `'${item.folderId}' in parents and name = '${escapedName}' and trashed = false`
          )}&fields=files(id,name,modifiedTime,size)&pageSize=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const existingServerFile = checkData.files?.[0];

          if (existingServerFile) {
            // CONFLICT DETECTED: Pause and open conflict modal for user choice
            setConflictModalItem({
              queueItem: item,
              serverFile: existingServerFile,
            });
            setIsSyncingQueue(false);
            return;
          }
        }

        // No conflict: upload directly
        const uploadRes = await uploadFileToServer(
          item.name,
          item.folderId,
          item.mimeType,
          item.blob
        );

        if (uploadRes.ok) {
          const uploadedData = await uploadRes.json();
          await removeOfflineUpload(item.queueId);
          await removeFileFromCache(item.queueId);

          // Save final uploaded file in cache
          await saveFileToCache({
            id: uploadedData.id,
            name: item.name,
            folderId: item.folderId,
            mimeType: item.mimeType,
            size: item.size,
            modifiedTime: new Date().toISOString(),
            cachedAt: Date.now(),
            blob: item.blob,
          });
        }
      } catch (err) {
        console.error(`Chyba při synchronizaci položky ${item.name}:`, err);
      }
    }

    setIsSyncingQueue(false);
    await refreshCacheStatus();
    if (currentFolder?.id) {
      await fetchFilesInFolder(currentFolder.id);
    }
  };

  // Resolve conflict: choice between client file or server file
  const handleResolveConflict = async (choice: 'client' | 'server') => {
    if (!conflictModalItem || !token) return;

    const { queueItem, serverFile } = conflictModalItem;
    setConflictModalItem(null);
    setIsSyncingQueue(true);

    try {
      if (choice === 'client') {
        // "Použít soubor z klienta" -> Přepsat soubor na serveru obsahem z klienta
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${serverFile.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': queueItem.mimeType || 'application/octet-stream',
            },
            body: queueItem.blob,
          }
        );

        if (updateRes.ok) {
          await saveFileToCache({
            id: serverFile.id,
            name: serverFile.name,
            folderId: queueItem.folderId,
            mimeType: queueItem.mimeType,
            size: queueItem.size,
            modifiedTime: new Date().toISOString(),
            cachedAt: Date.now(),
            blob: queueItem.blob,
          });
        }
      } else {
        // "Použít soubor ze serveru" -> Zahodit lokální soubor z klienta, stáhnout server verzi do keše
        const dlRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${serverFile.id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (dlRes.ok) {
          const serverBlob = await dlRes.blob();
          await saveFileToCache({
            id: serverFile.id,
            name: serverFile.name,
            folderId: queueItem.folderId,
            mimeType: queueItem.mimeType,
            size: serverBlob.size,
            modifiedTime: serverFile.modifiedTime,
            cachedAt: Date.now(),
            blob: serverBlob,
          });
        }
      }

      await removeOfflineUpload(queueItem.queueId);
      await removeFileFromCache(queueItem.queueId);
    } catch (err) {
      console.error('Chyba při řešení konfliktu:', err);
      alert('Při řešení konfliktu došlo k chybě.');
    } finally {
      setIsSyncingQueue(false);
      await refreshCacheStatus();
      if (currentFolder?.id) {
        await fetchFilesInFolder(currentFolder.id);
      }
      // Continue sync for remaining queue
      handleSyncOfflineQueue();
    }
  };

  // Upload local files from computer (online or offline into cache)
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesToUpload = Array.from(fileList);
    const targetFolderId = currentFolder?.id || rootFolderId;

    if (!token && !effectiveOffline) {
      alert('Pro nahrávání souborů musíte být přihlášeni.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!targetFolderId) {
      alert('Cílová složka nebyla nalezena.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // IF OFFLINE: Save to offline queue + local cache
    if (effectiveOffline) {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const queueId = `offline_${Date.now()}_${i}`;

        const queueItem: OfflineUploadItem = {
          queueId,
          name: file.name,
          folderId: targetFolderId,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          blob: file,
          createdAt: Date.now(),
        };

        await addOfflineUpload(queueItem);

        // Also save to cached_files so it is visible and downloadable immediately
        await saveFileToCache({
          id: queueId,
          name: file.name,
          folderId: targetFolderId,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          modifiedTime: new Date().toISOString(),
          cachedAt: Date.now(),
          blob: file,
        });
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshCacheStatus();
      await fetchFilesInFolder(targetFolderId);
      alert('Soubor(y) byly uloženy do offline keše. Jakmile budete online, můžete je nahrát na server.');
      return;
    }

    // IF ONLINE: Standard multipart upload to Google Drive
    setIsUploading(true);
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(
          `Nahrávám ${i + 1}/${filesToUpload.length}: ${file.name}...`
        );

        const res = await uploadFileToServer(
          file.name,
          targetFolderId,
          file.type,
          file
        );

        if (!res.ok) {
          console.error(`Upload failed for ${file.name}:`, await res.text());
        }
      }

      await fetchFilesInFolder(targetFolderId);
    } catch (err) {
      console.error('Chyba při nahrávání:', err);
      alert('Při nahrávání souborů došlo k chybě.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Create new folder (only folder name)
  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const targetFolderId = currentFolder?.id || rootFolderId;

    if (!token && !effectiveOffline) {
      alert('Pro vytvoření složky musíte být přihlášeni.');
      return;
    }

    if (!targetFolderId) return;

    setIsSavingFolder(true);
    try {
      if (effectiveOffline) {
        // Offline folder mock
        const newFolderId = `offline_folder_${Date.now()}`;
        await saveFolderToCache({
          id: newFolderId,
          name: newFolderName.trim(),
          cachedAt: Date.now(),
        });
        setNewFolderName('');
        setShowFolderModal(false);
        await refreshCacheStatus();
        await fetchFilesInFolder(targetFolderId);
        return;
      }

      const body = {
        name: newFolderName.trim(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [targetFolderId],
      };

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setNewFolderName('');
        setShowFolderModal(false);
        await fetchFilesInFolder(targetFolderId);
      }
    } catch (err) {
      console.error('Chyba při vytváření složky:', err);
    } finally {
      setIsSavingFolder(false);
    }
  };

  // Helper to trigger browser download
  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  // Download single file (supports offline cache retrieval)
  const downloadSingleFile = async (file: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (file.type === 'folder') return;

    // Check if available in local offline cache
    const cached = await getFileFromCache(file.id);
    if (cached) {
      triggerBrowserDownload(cached.blob, cached.name);
      return;
    }

    if (effectiveOffline) {
      alert(`Soubor "${file.name}" není v lokální offline keši. Pro jeho stažení se připojte k internetu nebo jej nejprve kešujte.`);
      return;
    }

    if (!token) {
      alert('Pro stahování souborů se prosím nejprve přihlaste.');
      return;
    }

    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    let filename = file.name;

    if (file.mimeType?.startsWith('application/vnd.google-apps.')) {
      if (file.mimeType.includes('spreadsheet')) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
        if (!filename.endsWith('.xlsx')) filename += '.xlsx';
      } else {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
        if (!filename.endsWith('.pdf')) filename += '.pdf';
      }
    }

    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      let errorMsg = `Nepodařilo se stáhnout soubor "${file.name}".`;
      try {
        const errJson = await res.json();
        if (
          errJson?.error?.code === 403 ||
          errJson?.error?.errors?.[0]?.reason === 'appNotAuthorizedToFile'
        ) {
          errorMsg = `K souboru "${file.name}" nemá aplikace oprávnění ke čtení obsahu. Odhlaste se a znovu přihlaste s plným oprávněním k Disku.`;
        }
      } catch {
        // fallback
      }
      alert(errorMsg);
      return;
    }

    const blob = await res.blob();
    triggerBrowserDownload(blob, filename);
  };

  // Download all selected files
  const handleDownloadSelected = async () => {
    const selectedFiles = files.filter(
      (f) => selectedIds.has(f.id) && f.type !== 'folder'
    );

    if (selectedFiles.length === 0) {
      alert('Označte prosím alespoň jeden soubor ke stažení.');
      return;
    }

    setIsDownloading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await downloadSingleFile(selectedFiles[i]);
        if (i < selectedFiles.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.error('Chyba při hromadném stahování:', err);
      alert('Při stahování souborů došlo k chybě.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Selection toggle handlers
  const handleToggleSelect = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Toggle star
  const handleToggleStar = async (id: string, currentStarred: boolean, e: MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, starred: !currentStarred } : f))
    );

    if (token && !effectiveOffline) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ starred: !currentStarred }),
        });
      } catch (err) {
        console.warn('Could not update star on Google Drive:', err);
      }
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    await removeFileFromCache(id);
    await removeOfflineUpload(id);
    await refreshCacheStatus();

    if (token && !effectiveOffline) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trashed: true }),
        });
      } catch (err) {
        console.warn('Could not delete file from Google Drive:', err);
      }
    }
  };

  const renderIcon = (type: DriveItem['type'], sizeClass = 'h-8 w-8') => {
    switch (type) {
      case 'folder':
        return <Folder className={`${sizeClass} text-amber-500 fill-amber-500/20 shrink-0`} />;
      case 'document':
        return <FileText className={`${sizeClass} text-blue-500 shrink-0`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${sizeClass} text-emerald-600 shrink-0`} />;
      case 'image':
        return <ImageIcon className={`${sizeClass} text-purple-500 shrink-0`} />;
      default:
        return <File className={`${sizeClass} text-muted-foreground shrink-0`} />;
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected =
    filteredFiles.length > 0 && selectedIds.size === filteredFiles.length;
  const isSomeSelected =
    selectedIds.size > 0 && selectedIds.size < filteredFiles.length;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Horní navigační lišta */}
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Brand & Root path */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-green-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              ▲
            </div>
            <span className="font-semibold text-base text-foreground tracking-tight hidden sm:inline">
              Disk Google
            </span>
          </Link>

          <span className="text-muted-foreground/40 hidden sm:inline">/</span>

          {/* Root directory indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <FolderTree className="h-3.5 w-3.5" />
            <span>/{ROOT_FOLDER_NAME}</span>
          </div>
        </div>

        {/* Vyhledávací pole */}
        <div className="relative flex-1 max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Hledat v ${currentFolder?.name || ROOT_FOLDER_NAME}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-muted border-input text-foreground focus-visible:bg-background rounded-full text-xs h-9"
          />
        </div>

        {/* Akce vpravo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline status & toggle */}
          <button
            type="button"
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              effectiveOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
            }`}
            title="Klikněte pro přepnutí simulace offline režimu"
          >
            {effectiveOffline ? (
              <WifiOff className="h-3.5 w-3.5" />
            ) : (
              <Wifi className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {effectiveOffline ? 'Offline režim' : 'Online'}
            </span>
          </button>

          <ThemeToggle />

          {/* Přepínač zobrazení Mřížka / Seznam */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background shadow-xs text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Mřížka"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-background shadow-xs text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Seznam"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (currentFolder?.id) {
                fetchFilesInFolder(currentFolder.id);
              } else {
                loadRootAndFiles();
              }
            }}
            disabled={isLoadingFiles}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Aktualizovat obsah"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          </Button>

          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Domů">
            <Link to="/">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </Button>

          {/* User profile / Log in */}
          {token ? (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 p-1 pl-1.5 bg-muted rounded-full border border-border"
                title={`${user?.name} (${user?.email})`}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'User'}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center text-[10px]">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-foreground max-w-[100px] truncate hidden lg:inline mr-1">
                  {user?.name || user?.email}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Odhlásit se"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="gap-1 text-xs border-input text-foreground">
              <Link to="/login">
                <LogIn className="h-3.5 w-3.5" />
                <span>Přihlásit</span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hlavní obsahová plocha */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-5">
        {/* Vyhledávací pole pro mobilní zařízení */}
        <div className="relative block md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Hledat v ${currentFolder?.name || ROOT_FOLDER_NAME}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-input rounded-full text-xs"
          />
        </div>

        {/* Offline sync banner (if items are waiting to be uploaded) */}
        {offlineQueue.length > 0 && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-semibold text-card-foreground">
                  Fronta offline nahrávání: {offlineQueue.length}{' '}
                  {offlineQueue.length === 1 ? 'soubor čeká' : 'soubory čekají'} na odeslání
                </span>
                <p className="text-muted-foreground text-[11px]">
                  {effectiveOffline
                    ? 'Pro odeslání na server se přepněte do online režimu.'
                    : 'Konektivita je aktivní. Můžete soubory synchronizovat na server.'}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleSyncOfflineQueue}
              disabled={effectiveOffline || isSyncingQueue}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-8 shrink-0"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
              <span>{isSyncingQueue ? 'Synchronizuji...' : 'Odeslat na server nyní'}</span>
            </Button>
          </div>
        )}

        {/* Drobečková navigace a hlavní akce (Nahrát soubor / Nová složka / Kontrola keše) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-xs">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <Button
              variant="ghost"
              size="sm"
              disabled={breadcrumbs.length <= 1}
              onClick={handleNavigateUp}
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground disabled:opacity-30 gap-1 rounded-lg"
              title="Přejít o úroveň výš"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Nahoru</span>
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            {breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={crumb.id || idx} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <button
                      onClick={() => handleNavigateBreadcrumb(idx)}
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
              <span className="font-semibold text-card-foreground">/{ROOT_FOLDER_NAME}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cache freshness check button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckCacheFreshness}
              disabled={isCheckingFreshness || effectiveOffline}
              className="border-input text-foreground text-xs gap-1.5 h-8 rounded-lg"
              title="Zkontrolovat aktuálnost keše vůči serveru"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingFreshness ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Zkontrolovat keš</span>
            </Button>

            {/* Upload file */}
            <Button
              size="sm"
              onClick={handleUploadClick}
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

            {/* New folder (only for folder name) */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFolderModal(true)}
              className="border-input text-foreground text-xs gap-1.5 h-8 rounded-lg"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Nová složka</span>
            </Button>
          </div>
        </div>

        {/* Upload progress message */}
        {isUploading && uploadProgressText && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs flex items-center gap-2 text-primary animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{uploadProgressText}</span>
          </div>
        )}

        {/* Výběrová lišta pro označené soubory */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 px-4 bg-primary/10 border border-primary/20 rounded-xl text-xs transition-all">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">
                Vybráno: {selectedIds.size}{' '}
                {selectedIds.size === 1
                  ? 'položka'
                  : selectedIds.size < 5
                  ? 'položky'
                  : 'položek'}
              </span>
              <button
                onClick={handleClearSelection}
                className="text-muted-foreground hover:text-foreground text-[11px] underline ml-2"
              >
                Zrušit výběr
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
              >
                <Download className={`h-3.5 w-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Stahuji...' : 'Stáhnout označené'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Upozornění, pokud kořenová složka na Disku zatím neexistuje */}
        {folderNotFound && !effectiveOffline && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-card-foreground">
                  Složka „{ROOT_FOLDER_NAME}“ zatím na vašem Disku neexistuje
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  V kořenovém adresáři vašeho Google Disku nebyla nalezena složka s tímto názvem.
                  Můžete ji jedním kliknutím vytvořit.
                </p>
              </div>
            </div>

            <Button
              onClick={handleCreateRootFolder}
              disabled={isCreatingRootFolder}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 self-start sm:self-auto shrink-0"
            >
              <FolderPlus className={`h-4 w-4 ${isCreatingRootFolder ? 'animate-spin' : ''}`} />
              <span>{isCreatingRootFolder ? 'Vytvářím...' : `Vytvořit složku ${ROOT_FOLDER_NAME}`}</span>
            </Button>
          </div>
        )}

        {/* Seznam / Mřížka souborů */}
        {!token && !effectiveOffline ? (
          <div className="text-center py-20 px-4 bg-card border border-border rounded-2xl space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <LogIn className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-card-foreground">Nejste přihlášeni</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Pro zobrazení, nahrávání a stahování souborů se prosím přihlaste pomocí svého účtu Google.
              </p>
            </div>
            <Button asChild size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                <span>Přihlásit se k Disku</span>
              </Link>
            </Button>
          </div>
        ) : isLoadingFiles ? (
          <div className="py-20 text-center space-y-3 bg-card border border-border rounded-2xl">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-card-foreground font-medium">
              Načítám soubory ze složky {currentFolder?.name || ROOT_FOLDER_NAME}...
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20 px-4 bg-card border border-border rounded-2xl space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Folder className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-card-foreground">Tato složka je prázdná</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? 'Žádný soubor neodpovídá zadanému filtru.'
                : effectiveOffline
                ? 'V této složce nejsou žádné kešované soubory ani položky čekající na nahrání.'
                : 'Nahrajte soubory ze svého počítače nebo vytvořte novou složku.'}
            </p>
            {searchQuery ? (
              <Button size="sm" variant="outline" onClick={() => setSearchQuery('')} className="border-input text-foreground">
                Zrušit filtr
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button size="sm" onClick={handleUploadClick} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Upload className="h-4 w-4 mr-1.5" />
                  Nahrát soubor
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowFolderModal(true)} className="border-input text-foreground">
                  <FolderPlus className="h-4 w-4 mr-1.5" />
                  Nová složka
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
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
                      handleOpenFolder(file);
                    } else if (file.webViewLink && !effectiveOffline) {
                      window.open(file.webViewLink, '_blank');
                    } else {
                      downloadSingleFile(file);
                    }
                  }}
                  className={`hover:border-primary hover:shadow-md transition-all cursor-pointer bg-card text-card-foreground border-border group relative ${
                    isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {/* Checkbox for selection */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(file.id, e)}
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
                        {renderIcon(file.type)}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Offline cache toggle button */}
                        <button
                          type="button"
                          onClick={(e) =>
                            isFolder
                              ? handleToggleCacheFolder(file, e)
                              : handleToggleCacheFile(file, e)
                          }
                          className={`p-1 rounded-md transition-colors ${
                            isCached
                              ? 'text-emerald-500 hover:text-emerald-600'
                              : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
                          }`}
                          title={
                            isCached
                              ? 'Uloženo v offline keši (kliknutím odeberete)'
                              : 'Uložit do offline keše pro práci bez internetu'
                          }
                        >
                          {isCached ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <HardDriveDownload className="h-4 w-4" />
                          )}
                        </button>

                        {!isFolder && (
                          <button
                            type="button"
                            onClick={(e) => downloadSingleFile(file, e)}
                            className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted transition-colors"
                            title="Stáhnout do počítače"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}

                        {file.webViewLink && !effectiveOffline && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted"
                            title="Otevřít na Google Disku"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(file.id, Boolean(file.starred), e)}
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
                          onClick={(e) => handleDeleteItem(file.id, e)}
                          className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-muted transition-colors"
                          title="Smazat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        ) : (
          /* List View */
          <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider items-center">
              <div className="col-span-1 flex items-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
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
              <div className="col-span-5">Název</div>
              <div className="col-span-2">Stav keše</div>
              <div className="col-span-2">Velikost / Upraveno</div>
              <div className="col-span-2 text-right">Akce</div>
            </div>

            <div className="divide-y divide-border">
              {filteredFiles.map((file) => {
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
                        handleOpenFolder(file);
                      } else if (file.webViewLink && !effectiveOffline) {
                        window.open(file.webViewLink, '_blank');
                      } else {
                        downloadSingleFile(file);
                      }
                    }}
                    className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/50 transition-colors group text-sm cursor-pointer ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelect(file.id, e)}
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

                    <div className="col-span-5 flex items-center gap-3 truncate">
                      {renderIcon(file.type, 'h-5 w-5')}
                      <span className="font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                        {file.name}
                      </span>
                    </div>

                    <div className="col-span-2 text-xs">
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

                    <div className="col-span-2 text-xs text-muted-foreground">
                      {file.size ? `${file.size} • ` : ''}
                      {file.modified}
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {/* Offline cache button */}
                      <button
                        type="button"
                        onClick={(e) =>
                          isFolder
                            ? handleToggleCacheFolder(file, e)
                            : handleToggleCacheFile(file, e)
                        }
                        className={`p-1 rounded-md transition-colors ${
                          isCached
                            ? 'text-emerald-500 hover:text-emerald-600'
                            : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
                        }`}
                        title={
                          isCached
                            ? 'Uloženo v offline keši (kliknutím odeberete)'
                            : 'Uložit do offline keše pro práci bez internetu'
                        }
                      >
                        {isCached ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <HardDriveDownload className="h-4 w-4" />
                        )}
                      </button>

                      {!isFolder && (
                        <button
                          type="button"
                          onClick={(e) => downloadSingleFile(file, e)}
                          className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted"
                          title="Stáhnout do počítače"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}

                      {file.webViewLink && !effectiveOffline && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted"
                          title="Otevřít na Disku"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(file.id, Boolean(file.starred), e)}
                        className={`p-1 rounded-md hover:bg-muted ${
                          file.starred
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/40 hover:text-muted-foreground'
                        }`}
                        title="Hvězdička"
                      >
                        <Star className={`h-4 w-4 ${file.starred ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(file.id, e)}
                        className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-muted"
                        title="Smazat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal pro vytvoření nové složky (pouze název složky dle požadavku) */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-card text-card-foreground rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-card-foreground">Vytvořit novou složku</h3>
                <p className="text-[11px] text-muted-foreground">
                  ve složce {currentFolder?.name || ROOT_FOLDER_NAME}
                </p>
              </div>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-card-foreground">Název složky:</label>
                <Input
                  type="text"
                  placeholder="např. Podklady"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
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
                  onClick={() => setShowFolderModal(false)}
                  className="border-input text-foreground"
                >
                  Zrušit
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingFolder}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isSavingFolder ? 'Vytvářím...' : 'Vytvořit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pro řešení konfliktu (BOD 4: volba server vs klient) */}
      {conflictModalItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-card-foreground">Detekován konflikt souboru</h3>
                <p className="text-xs text-muted-foreground">
                  Soubor „{conflictModalItem.queueItem.name}“ byl upraven i na serveru.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Vyberte, kterou verzi chcete zachovat. Sloučení (merge) není vyžadováno:
              </p>

              {/* Server version card */}
              <div className="p-3 bg-muted rounded-xl border border-border space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                  <span>Verze na serveru (Google Disk)</span>
                </div>
                <div className="text-muted-foreground text-[11px] pl-5">
                  Poslední změna:{' '}
                  {new Date(conflictModalItem.serverFile.modifiedTime).toLocaleString('cs-CZ')}
                </div>
              </div>

              {/* Client version card */}
              <div className="p-3 bg-muted rounded-xl border border-border space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Verze z klienta (offline nahráno)</span>
                </div>
                <div className="text-muted-foreground text-[11px] pl-5">
                  Velikost: {(conflictModalItem.queueItem.size / 1024).toFixed(0)} KB • Vytvořeno:{' '}
                  {new Date(conflictModalItem.queueItem.createdAt).toLocaleString('cs-CZ')}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleResolveConflict('server')}
                className="flex-1 text-xs border-input text-foreground h-9"
              >
                Použít soubor ze serveru
              </Button>
              <Button
                type="button"
                onClick={() => handleResolveConflict('client')}
                className="flex-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9"
              >
                Použít soubor z klienta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
