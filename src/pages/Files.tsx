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
import { Link, Navigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Home as HomeIcon,
  LogIn,
  LayoutGrid,
  List,
  LogOut,
  AlertCircle,
  FolderTree,
  Wifi,
  WifiOff,
  Clock,
  RotateCw,
  FolderSync,
  X,
  CheckCircle2,
  Folder,
  Upload,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ExtendedDriveItem,
  BreadcrumbItem,
  ClipboardState,
  OperationConflict,
} from '@/types/DriveItem';
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
import {
  searchFolderByName,
  fetchFolderContents,
  createDriveFolder,
  uploadMultipartFile,
  updateDriveFileContent,
  downloadDriveBlob,
  renameDriveItem,
  copyDriveFile,
  moveDriveItem,
  trashDriveItem,
  toggleDriveStar,
  findConflictingFile,
} from '@/services/driveService';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { FileBreadcrumbs } from '@/components/files/FileBreadcrumbs';
import { FileSelectionBar } from '@/components/files/FileSelectionBar';
import { FileClipboardBar } from '@/components/files/FileClipboardBar';
import { FileGridView } from '@/components/files/FileGridView';
import { FileListView } from '@/components/files/FileListView';
import { CreateFolderModal } from '@/components/files/modals/CreateFolderModal';
import { RenameModal } from '@/components/files/modals/RenameModal';
import { ConflictModal } from '@/components/files/modals/ConflictModal';

export const ROOT_FOLDER_NAME =
  import.meta.env.VITE_ROOT_FOLDER_NAME ||
  import.meta.env.RootFolderName || '';

export const Files: FC = () => {
  const { token, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [files, setFiles] = useState<ExtendedDriveItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [rootFolderId, setRootFolderId] = useState<string | null>(() => {
    return localStorage.getItem('last_root_folder_id');
  });
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [folderNotFound, setFolderNotFound] = useState<boolean>(false);
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState<boolean>(false);

  // Connectivity and simulated offline
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.electronAPI) return true;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const effectiveOffline = !isOnline || isSimulatedOffline;

  const toggleOffline = () => {
    if (effectiveOffline) {
      setIsOnline(true);
      setIsSimulatedOffline(false);
    } else {
      setIsSimulatedOffline(true);
    }
  };

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

  // Folder creation modal state
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isSavingFolder, setIsSavingFolder] = useState<boolean>(false);

  // Clipboard state (Copy / Cut / Paste)
  const [clipboard, setClipboard] = useState<ClipboardState>(null);
  const [isProcessingPaste, setIsProcessingPaste] = useState<boolean>(false);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<ExtendedDriveItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  // Operation conflict state
  const [opConflict, setOpConflict] = useState<OperationConflict | null>(null);

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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch files in active folder
  const fetchFilesInFolder = useCallback(
    async (folderId: string) => {
      if (!token) {
        setIsLoadingFiles(false);
        setFiles([]);
        return;
      }

      setIsLoadingFiles(true);

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
          console.error('Chyba při čtení keše:', err);
        } finally {
          setIsLoadingFiles(false);
        }
        return;
      }

      try {
        const driveItems = await fetchFolderContents(token, folderId);
        const queue = await getOfflineUploads();
        const folderQueue = queue.filter((q) => q.folderId === folderId);

        const merged: ExtendedDriveItem[] = [
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
          ...driveItems,
        ];

        setFiles(merged);
      } catch (err) {
        console.error('Chyba při načítání souborů:', err);
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [token, effectiveOffline]
  );

  // Initialize root folder and files
  const loadRootAndFiles = useCallback(async () => {
    if (!token) {
      setFiles([]);
      setBreadcrumbs([]);
      return;
    }

    if (effectiveOffline) {
      const mockRootId = localStorage.getItem('last_root_folder_id') || 'offline_root';
      setRootFolderId(mockRootId);
      setBreadcrumbs((prev) => (prev.length > 0 ? prev : [{ id: mockRootId, name: ROOT_FOLDER_NAME }]));
      await fetchFilesInFolder(mockRootId);
      return;
    }

    setIsLoadingFiles(true);
    setFolderNotFound(false);

    try {
      const targetFolder = await searchFolderByName(token, ROOT_FOLDER_NAME);

      if (!targetFolder) {
        setRootFolderId(null);
        setBreadcrumbs([]);
        setFolderNotFound(true);
        setFiles([]);
        return;
      }

      setRootFolderId(targetFolder.id);
      localStorage.setItem('last_root_folder_id', targetFolder.id);
      setBreadcrumbs([{ id: targetFolder.id, name: ROOT_FOLDER_NAME }]);
      await fetchFilesInFolder(targetFolder.id);
    } catch (err) {
      console.error('Chyba při hledání root složky:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [token, effectiveOffline, fetchFilesInFolder]);

  useEffect(() => {
    loadRootAndFiles();
  }, [loadRootAndFiles]);

  const handleRefreshNeeded = useCallback(() => {
    const activeFolderId = currentFolder?.id || rootFolderId;
    if (activeFolderId) {
      fetchFilesInFolder(activeFolderId);
    }
  }, [currentFolder?.id, rootFolderId, fetchFilesInFolder]);

  // Hook for Electron file watcher and auto-upload
  const {
    watchFolderPath,
    isWatchingLocalFolder,
    localSyncNotice,
    clearLocalSyncNotice,
  } = useFileWatcher({
    token,
    effectiveOffline,
    currentFolderId: currentFolder?.id || rootFolderId,
    onRefreshNeeded: handleRefreshNeeded,
  });

  // Navigation handlers
  const handleOpenFolder = (folder: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedIds(new Set());
    setSearchQuery('');
    fetchFilesInFolder(folder.id);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    if (index === breadcrumbs.length - 1) return;
    const targetCrumb = breadcrumbs[index];
    const updated = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(updated);
    setSelectedIds(new Set());
    setSearchQuery('');
    if (targetCrumb.id) fetchFilesInFolder(targetCrumb.id);
  };

  const handleNavigateUp = () => {
    if (breadcrumbs.length <= 1) return;
    handleNavigateBreadcrumb(breadcrumbs.length - 2);
  };

  const handleCreateRootFolder = async () => {
    if (!token || effectiveOffline) return;
    setIsCreatingRootFolder(true);
    try {
      await createDriveFolder(token, ROOT_FOLDER_NAME);
      await loadRootAndFiles();
    } catch (err) {
      console.error('Chyba při vytváření kořenové složky:', err);
    } finally {
      setIsCreatingRootFolder(false);
    }
  };

  // Caching handlers
  const handleToggleCacheFile = async (file: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (file.type === 'folder') return;

    if (cachedFileIds.has(file.id)) {
      await removeFileFromCache(file.id);
      await refreshCacheStatus();
      if (window.electronAPI) {
        try {
          await window.electronAPI.deleteFileFromSyncFolder(file.name);
        } catch (err) {
          console.warn('Could not delete from sync folder:', err);
        }
      }
      if (effectiveOffline) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
      return;
    }

    if (!token) {
      alert('Pro uložení do keše se musíte nejprve přihlásit.');
      return;
    }
    if (effectiveOffline) {
      alert('Pro první stažení do keše musíte být online.');
      return;
    }

    try {
      const blob = await downloadDriveBlob(token, file.id, file.mimeType);
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

      if (window.electronAPI) {
        try {
          const buffer = await blob.arrayBuffer();
          await window.electronAPI.saveFileToSyncFolder(file.name, buffer);
        } catch (err) {
          console.warn('Could not save to sync folder:', err);
        }
      }

      await refreshCacheStatus();
    } catch (err) {
      console.error('Chyba při kešování souboru:', err);
      alert(`Nepodařilo se uložit soubor "${file.name}" do keše.`);
    }
  };

  const handleToggleCacheFolder = async (folder: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();

    if (cachedFolderIds.has(folder.id)) {
      await removeFolderFromCache(folder.id);
      await refreshCacheStatus();
      return;
    }

    if (effectiveOffline || !token) {
      alert('Pro kešování složky musíte být online a přihlášeni.');
      return;
    }

    try {
      await saveFolderToCache({
        id: folder.id,
        name: folder.name,
        cachedAt: Date.now(),
      });

      const folderItems = await fetchFolderContents(token, folder.id);
      for (const item of folderItems) {
        if (item.type !== 'folder') {
          try {
            const blob = await downloadDriveBlob(token, item.id, item.mimeType);
            await saveFileToCache({
              id: item.id,
              name: item.name,
              folderId: folder.id,
              mimeType: item.mimeType || 'application/octet-stream',
              size: blob.size,
              modifiedTime: item.modifiedTimeRaw || new Date().toISOString(),
              cachedAt: Date.now(),
              blob,
            });
          } catch {
            // continue
          }
        }
      }

      await refreshCacheStatus();
    } catch (err) {
      console.error('Chyba při kešování složky:', err);
    }
  };

  const handleCheckCacheFreshness = async () => {
    if (effectiveOffline || !token) {
      alert('Pro kontrolu aktuálnosti keše musíte být online.');
      return;
    }

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
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${cached.id}?fields=id,name,modifiedTime,trashed`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!res.ok) {
            if (res.status === 404) {
              await removeFileFromCache(cached.id);
              removedCount++;
            }
            continue;
          }

          const serverData = await res.json();
          if (serverData.trashed) {
            await removeFileFromCache(cached.id);
            removedCount++;
            continue;
          }

          const serverTime = new Date(serverData.modifiedTime).getTime();
          const cachedTime = new Date(cached.modifiedTime).getTime();

          if (serverTime > cachedTime) {
            const newBlob = await downloadDriveBlob(token, cached.id, cached.mimeType);
            await saveFileToCache({
              ...cached,
              modifiedTime: serverData.modifiedTime,
              cachedAt: Date.now(),
              blob: newBlob,
              size: newBlob.size,
            });
            updatedCount++;
          } else {
            upToDateCount++;
          }
        } catch (err) {
          console.warn(`Nepodařilo se ověřit ${cached.name}:`, err);
        }
      }

      await refreshCacheStatus();
      alert(
        `Kontrola keše dokončena:\n• ${updatedCount} souborů aktualizováno\n• ${upToDateCount} aktuálních${
          removedCount > 0 ? `\n• ${removedCount} smazaných odebráno z keše` : ''
        }`
      );
    } catch (err) {
      console.error('Chyba při kontrole keše:', err);
      alert('Při kontrole keše došlo k chybě.');
    } finally {
      setIsCheckingFreshness(false);
    }
  };

  // Offline Upload Queue Synchronization
  const handleSyncOfflineQueue = async () => {
    if (effectiveOffline || !token) {
      alert('Pro synchronizaci odchozí fronty musíte být online.');
      return;
    }

    const queue = await getOfflineUploads();
    if (queue.length === 0) {
      alert('Ve frontě offline nahrávání nejsou žádné soubory.');
      return;
    }

    setIsSyncingQueue(true);

    for (const item of queue) {
      try {
        const existing = await findConflictingFile(token, item.folderId, item.name);

        if (existing) {
          setConflictModalItem({ queueItem: item, serverFile: existing });
          setIsSyncingQueue(false);
          return;
        }

        const res = await uploadMultipartFile(
          token,
          item.name,
          item.folderId,
          item.mimeType,
          item.blob
        );

        await removeOfflineUpload(item.queueId);
        await removeFileFromCache(item.queueId);

        await saveFileToCache({
          id: res.id,
          name: item.name,
          folderId: item.folderId,
          mimeType: item.mimeType,
          size: item.size,
          modifiedTime: new Date().toISOString(),
          cachedAt: Date.now(),
          blob: item.blob,
        });
      } catch (err) {
        console.error(`Chyba při odesílání ${item.name}:`, err);
      }
    }

    setIsSyncingQueue(false);
    await refreshCacheStatus();
    if (currentFolder?.id) await fetchFilesInFolder(currentFolder.id);
  };

  const handleResolveOfflineConflict = async (choice: 'client' | 'server') => {
    if (!conflictModalItem || !token) return;

    const { queueItem, serverFile } = conflictModalItem;
    setConflictModalItem(null);
    setIsSyncingQueue(true);

    try {
      if (choice === 'client') {
        await updateDriveFileContent(
          token,
          serverFile.id,
          queueItem.mimeType,
          queueItem.blob
        );
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
      } else {
        const serverBlob = await downloadDriveBlob(token, serverFile.id);
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

      await removeOfflineUpload(queueItem.queueId);
      await removeFileFromCache(queueItem.queueId);
    } catch (err) {
      console.error('Chyba při řešení konfliktu:', err);
      alert('Při řešení konfliktu došlo k chybě.');
    } finally {
      setIsSyncingQueue(false);
      await refreshCacheStatus();
      if (currentFolder?.id) await fetchFilesInFolder(currentFolder.id);
      handleSyncOfflineQueue();
    }
  };

  // Upload handlers
  const handleUploadClick = () => fileInputRef.current?.click();

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

    if (effectiveOffline) {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const queueId = `offline_${Date.now()}_${i}`;

        await addOfflineUpload({
          queueId,
          name: file.name,
          folderId: targetFolderId,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          blob: file,
          createdAt: Date.now(),
        });

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

        if (window.electronAPI) {
          try {
            const buffer = await file.arrayBuffer();
            await window.electronAPI.saveFileToSyncFolder(file.name, buffer);
          } catch (err) {
            console.warn('Could not save offline file to sync folder:', err);
          }
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshCacheStatus();
      await fetchFilesInFolder(targetFolderId);
      alert('Soubory uloženy do offline keše. Po obnovení sítě se automaticky nahrají.');
      return;
    }

    if (!token) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(`Nahrávám ${i + 1}/${filesToUpload.length}: ${file.name}...`);
        const uploaded = await uploadMultipartFile(token, file.name, targetFolderId, file.type, file);

        await saveFileToCache({
          id: uploaded.id,
          name: file.name,
          folderId: targetFolderId,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          modifiedTime: new Date().toISOString(),
          cachedAt: Date.now(),
          blob: file,
        });

        if (window.electronAPI) {
          try {
            const buffer = await file.arrayBuffer();
            await window.electronAPI.saveFileToSyncFolder(file.name, buffer);
          } catch (err) {
            console.warn('Could not save uploaded file to sync folder:', err);
          }
        }
      }
      await refreshCacheStatus();
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

  // Folder modal creation handler
  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const targetFolderId = currentFolder?.id || rootFolderId;
    if (!targetFolderId) return;

    setIsSavingFolder(true);
    try {
      if (effectiveOffline) {
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

      if (token) {
        await createDriveFolder(token, newFolderName.trim(), targetFolderId);
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

  // Download file helper (with Electron watched folder auto-save)
  const downloadSingleFile = async (file: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (file.type === 'folder') return;

    const triggerBlob = async (blob: Blob, filename: string) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      if (window.electronAPI) {
        try {
          const buffer = await blob.arrayBuffer();
          await window.electronAPI.saveFileToSyncFolder(filename, buffer);
        } catch (err) {
          console.warn('Could not save to sync folder:', err);
        }
      }
    };

    const cached = await getFileFromCache(file.id);
    if (cached) {
      await triggerBlob(cached.blob, cached.name);
      return;
    }

    if (effectiveOffline) {
      alert(`Soubor "${file.name}" není v lokální keši.`);
      return;
    }

    if (!token) {
      alert('Pro stahování souborů se nejprve přihlaste.');
      return;
    }

    try {
      const blob = await downloadDriveBlob(token, file.id, file.mimeType);
      await triggerBlob(blob, file.name);
    } catch (err: any) {
      if (err.message === 'AUTH_FORBIDDEN') {
        alert(`K souboru "${file.name}" nemá aplikace oprávnění ke čtení. Odhlaste se a znovu přihlaste s plným oprávněním.`);
      } else {
        alert(`Nepodařilo se stáhnout soubor "${file.name}".`);
      }
    }
  };

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
    } finally {
      setIsDownloading(false);
    }
  };

  // Rename handlers
  const handleStartRename = (file: ExtendedDriveItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setRenameTarget(file);
    setRenameInputValue(file.name);
  };

  const handleRenameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameInputValue.trim() || !token) return;

    const newName = renameInputValue.trim();
    if (newName === renameTarget.name) {
      setRenameTarget(null);
      return;
    }

    const existing = files.find(
      (f) => f.name.toLowerCase() === newName.toLowerCase() && f.id !== renameTarget.id
    );

    if (existing) {
      setOpConflict({
        type: 'rename',
        item: renameTarget,
        existingItemName: existing.name,
        onResolve: async (choice) => {
          setOpConflict(null);
          if (choice === 'cancel') return;

          setIsRenaming(true);
          try {
            if (choice === 'overwrite') {
              await trashDriveItem(token, existing.id);
              if (window.electronAPI) {
                await window.electronAPI.deleteFileFromSyncFolder(existing.name);
              }
            }
            await renameDriveItem(token, renameTarget.id, newName);
            if (window.electronAPI) {
              await window.electronAPI.renameFileInSyncFolder(renameTarget.name, newName);
            }
            const cached = await getFileFromCache(renameTarget.id);
            if (cached) {
              await saveFileToCache({ ...cached, name: newName });
            }
            setRenameTarget(null);
            if (currentFolder?.id) await fetchFilesInFolder(currentFolder.id);
          } catch (err) {
            console.error('Chyba při přejmenování:', err);
          } finally {
            setIsRenaming(false);
          }
        },
      });
      return;
    }

    setIsRenaming(true);
    try {
      await renameDriveItem(token, renameTarget.id, newName);
      if (window.electronAPI) {
        await window.electronAPI.renameFileInSyncFolder(renameTarget.name, newName);
      }
      const cached = await getFileFromCache(renameTarget.id);
      if (cached) {
        await saveFileToCache({ ...cached, name: newName });
      }
      setRenameTarget(null);
      if (currentFolder?.id) await fetchFilesInFolder(currentFolder.id);
    } catch (err) {
      console.error('Chyba při přejmenování:', err);
    } finally {
      setIsRenaming(false);
    }
  };

  // Clipboard operations (Copy, Cut, Paste)
  const handleCopy = (items: ExtendedDriveItem[], e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (items.length === 0) return;
    setClipboard({
      action: 'copy',
      items,
      sourceFolderId: currentFolder?.id || rootFolderId || '',
    });
  };

  const handleCut = (items: ExtendedDriveItem[], e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (items.length === 0) return;
    setClipboard({
      action: 'cut',
      items,
      sourceFolderId: currentFolder?.id || rootFolderId || '',
    });
  };

  const handlePaste = async () => {
    if (!clipboard || !token || effectiveOffline) {
      alert('Pro vložení položek musíte mít položky ve schránce a být online.');
      return;
    }

    const targetFolderId = currentFolder?.id || rootFolderId;
    if (!targetFolderId) return;

    setIsProcessingPaste(true);
    try {
      for (const item of clipboard.items) {
        const existing = files.find(
          (f) => f.name.toLowerCase() === item.name.toLowerCase()
        );

        if (existing) {
          await new Promise<void>((resolve) => {
            setOpConflict({
              type: 'paste',
              item,
              existingItemName: existing.name,
              onResolve: async (choice) => {
                setOpConflict(null);
                if (choice === 'cancel') {
                  resolve();
                  return;
                }

                let finalName = item.name;
                if (choice === 'keep_both') {
                  finalName = `Kopie - ${item.name}`;
                } else if (choice === 'overwrite') {
                  await trashDriveItem(token, existing.id);
                }

                if (clipboard.action === 'copy') {
                  if (item.type === 'folder') {
                    await createDriveFolder(token, finalName, targetFolderId);
                  } else {
                    await copyDriveFile(token, item.id, finalName, targetFolderId);
                  }
                } else {
                  await moveDriveItem(
                    token,
                    item.id,
                    targetFolderId,
                    clipboard.sourceFolderId,
                    finalName
                  );
                }
                resolve();
              },
            });
          });
        } else {
          if (clipboard.action === 'copy') {
            if (item.type === 'folder') {
              await createDriveFolder(token, item.name, targetFolderId);
            } else {
              await copyDriveFile(token, item.id, item.name, targetFolderId);
            }
          } else {
            await moveDriveItem(
              token,
              item.id,
              targetFolderId,
              clipboard.sourceFolderId
            );
          }
        }
      }

      if (clipboard.action === 'cut') setClipboard(null);
      await fetchFilesInFolder(targetFolderId);
    } catch (err) {
      console.error('Chyba při vkládání položek:', err);
      alert('Při vkládání položek došlo k chybě.');
    } finally {
      setIsProcessingPaste(false);
    }
  };

  // Delete operations
  const handleDeleteItem = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Opravdu chcete tuto položku smazat?')) return;

    const targetFile = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    await removeFileFromCache(id);
    await removeOfflineUpload(id);
    await refreshCacheStatus();

    if (targetFile && window.electronAPI) {
      try {
        await window.electronAPI.deleteFileFromSyncFolder(targetFile.name);
      } catch (err) {
        console.warn('Could not delete from sync folder:', err);
      }
    }

    if (token && !effectiveOffline) {
      try {
        await trashDriveItem(token, id);
      } catch (err) {
        console.warn('Could not trash item on Drive:', err);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Opravdu chcete smazat ${selectedIds.size} vybraných položek?`)) return;

    const ids = Array.from(selectedIds);
    const targets = files.filter((f) => selectedIds.has(f.id));
    setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    setSelectedIds(new Set());

    for (const id of ids) {
      await removeFileFromCache(id);
      await removeOfflineUpload(id);
      if (token && !effectiveOffline) {
        try {
          await trashDriveItem(token, id);
        } catch {
          // continue
        }
      }
    }

    if (window.electronAPI) {
      for (const t of targets) {
        try {
          await window.electronAPI.deleteFileFromSyncFolder(t.name);
        } catch (err) {
          console.warn('Could not delete from sync folder:', err);
        }
      }
    }

    await refreshCacheStatus();
  };

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

  const handleToggleStar = async (id: string, currentStarred: boolean, e: MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, starred: !currentStarred } : f))
    );
    if (token && !effectiveOffline) {
      await toggleDriveStar(token, id, !currentStarred);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedItemsList = files.filter((f) => selectedIds.has(f.id));

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="font-semibold text-base text-foreground tracking-tight hidden sm:inline">
              Disk Google
            </span>
          </Link>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <FolderTree className="h-3.5 w-3.5" />
            <span>/{ROOT_FOLDER_NAME}</span>
          </div>
        </div>

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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleOffline}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              effectiveOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
            }`}
            title="Klikněte pro přepnutí offline režimu"
          >
            {effectiveOffline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {effectiveOffline ? 'Offline režim' : 'Online'}
            </span>
          </button>

          <ThemeToggle />

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
              if (currentFolder?.id) fetchFilesInFolder(currentFolder.id);
              else loadRootAndFiles();
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

          {token ? (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 p-1 pl-1.5 bg-muted rounded-full border border-border"
                title={`${user?.name} (${user?.email})`}
              >
                <span className="text-xs font-medium text-foreground max-w-[100px] truncate hidden lg:inline mr-1">
                  {user?.name || user?.email}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Odhlásit se">
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-4">
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

        {/* Local Sync Notification */}
        {localSyncNotice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between text-emerald-600 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{localSyncNotice}</span>
            </div>
            <button onClick={clearLocalSyncNotice} className="p-1 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Electron Watched Folder Status Banner */}
        {isWatchingLocalFolder && (
          <div className="px-4 py-2 bg-muted/60 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <FolderSync className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-foreground shrink-0">Sledovaná složka pro auto-upload:</span>
              <span className="font-mono text-[11px] truncate" title={watchFolderPath}>
                {watchFolderPath}
              </span>
            </div>
          </div>
        )}

        {/* Offline Upload Queue Banner */}
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

        {/* Clipboard Actions Bar */}
        <FileClipboardBar
          clipboard={clipboard}
          isProcessingPaste={isProcessingPaste}
          effectiveOffline={effectiveOffline}
          onPaste={handlePaste}
          onClear={() => setClipboard(null)}
        />

        {/* Breadcrumbs and Top Actions */}
        <FileBreadcrumbs
          breadcrumbs={breadcrumbs}
          rootFolderName={ROOT_FOLDER_NAME}
          isUploading={isUploading}
          isCheckingFreshness={isCheckingFreshness}
          effectiveOffline={effectiveOffline}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          onNavigateUp={handleNavigateUp}
          onCheckCache={handleCheckCacheFreshness}
          onUploadClick={handleUploadClick}
          onOpenFolderModal={() => setShowFolderModal(true)}
        />

        {/* Upload Progress */}
        {isUploading && uploadProgressText && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs flex items-center gap-2 text-primary animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{uploadProgressText}</span>
          </div>
        )}

        {/* Multi-Selection Actions Bar */}
        {selectedIds.size > 0 && (
          <FileSelectionBar
            selectedCount={selectedIds.size}
            selectedItems={selectedItemsList}
            isDownloading={isDownloading}
            onClearSelection={() => setSelectedIds(new Set())}
            onCopy={(items) => handleCopy(items)}
            onCut={(items) => handleCut(items)}
            onDownload={handleDownloadSelected}
            onDelete={handleDeleteSelected}
          />
        )}

        {/* Folder Not Found Notice */}
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

        {/* File Grid/List or Empty/Login State */}
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
          <FileGridView
            files={filteredFiles}
            selectedIds={selectedIds}
            cachedFileIds={cachedFileIds}
            cachedFolderIds={cachedFolderIds}
            effectiveOffline={effectiveOffline}
            onSelect={handleToggleSelect}
            onOpenFolder={handleOpenFolder}
            onDownloadFile={downloadSingleFile}
            onToggleCacheFile={handleToggleCacheFile}
            onToggleCacheFolder={handleToggleCacheFolder}
            onCopy={handleCopy}
            onCut={handleCut}
            onRename={handleStartRename}
            onToggleStar={handleToggleStar}
            onDelete={handleDeleteItem}
          />
        ) : (
          <FileListView
            files={filteredFiles}
            selectedIds={selectedIds}
            cachedFileIds={cachedFileIds}
            cachedFolderIds={cachedFolderIds}
            effectiveOffline={effectiveOffline}
            onSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onOpenFolder={handleOpenFolder}
            onDownloadFile={downloadSingleFile}
            onToggleCacheFile={handleToggleCacheFile}
            onToggleCacheFolder={handleToggleCacheFolder}
            onCopy={handleCopy}
            onCut={handleCut}
            onRename={handleStartRename}
            onToggleStar={handleToggleStar}
            onDelete={handleDeleteItem}
          />
        )}
      </main>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showFolderModal}
        parentFolderName={currentFolder?.name || ROOT_FOLDER_NAME}
        folderName={newFolderName}
        isSaving={isSavingFolder}
        onNameChange={setNewFolderName}
        onSubmit={handleCreateFolder}
        onClose={() => setShowFolderModal(false)}
      />

      <RenameModal
        item={renameTarget}
        newName={renameInputValue}
        isRenaming={isRenaming}
        onNameChange={setRenameInputValue}
        onSubmit={handleRenameSubmit}
        onClose={() => setRenameTarget(null)}
      />

      <ConflictModal
        offlineConflict={conflictModalItem}
        operationConflict={opConflict}
        onResolveOffline={handleResolveOfflineConflict}
        onResolveOperation={(choice) => opConflict?.onResolve(choice)}
      />
    </div>
  );
};
