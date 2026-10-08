import { useState, useEffect, useRef } from 'react';
import { uploadMultipartFile, updateDriveFileContent, findConflictingFile, trashDriveItem } from '@/services/driveService';
import { removeFileFromCache } from '@/lib/offlineStorage';

type UseFileWatcherProps = {
  token: string | null;
  effectiveOffline: boolean;
  currentFolderId: string | null;
  onRefreshNeeded: () => void;
};

export function useFileWatcher({
  token,
  effectiveOffline,
  currentFolderId,
  onRefreshNeeded,
}: UseFileWatcherProps) {
  const [watchFolderPath, setWatchFolderPath] = useState<string>('');
  const [isWatchingLocalFolder, setIsWatchingLocalFolder] = useState<boolean>(false);
  const [localSyncNotice, setLocalSyncNotice] = useState<string | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;
  const effectiveOfflineRef = useRef(effectiveOffline);
  effectiveOfflineRef.current = effectiveOffline;
  const currentFolderIdRef = useRef(currentFolderId);
  currentFolderIdRef.current = currentFolderId;
  const onRefreshNeededRef = useRef(onRefreshNeeded);
  onRefreshNeededRef.current = onRefreshNeeded;

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.getWatchStatus().then((status) => {
      setIsWatchingLocalFolder(status.isWatching);
      setWatchFolderPath(status.folderPath);
    });

    const unsubscribeChange = window.electronAPI.onLocalFileChange(async ({ filename, base64Data, mimeType }) => {
      const activeToken = tokenRef.current;
      const isOffline = effectiveOfflineRef.current;
      const activeFolderId = currentFolderIdRef.current;

      if (!activeToken || isOffline || !activeFolderId) return;

      try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const existingFile = await findConflictingFile(activeToken, activeFolderId, filename);

        if (existingFile) {
          await updateDriveFileContent(activeToken, existingFile.id, mimeType, blob);
        } else {
          await uploadMultipartFile(activeToken, filename, activeFolderId, mimeType, blob);
        }

        setLocalSyncNotice(`Lokálně upravený soubor „${filename}“ byl automaticky synchronizován na Google Disk.`);
        setTimeout(() => setLocalSyncNotice(null), 5000);
        onRefreshNeededRef.current();
      } catch (err) {
        console.error('Chyba při automatickém uploadu lokálně změněného souboru:', err);
      }
    });

    const unsubscribeDelete = window.electronAPI.onLocalFileDelete(async ({ filename }) => {
      const activeToken = tokenRef.current;
      const isOffline = effectiveOfflineRef.current;
      const activeFolderId = currentFolderIdRef.current;

      if (!activeToken || isOffline || !activeFolderId) return;

      try {
        const existing = await findConflictingFile(activeToken, activeFolderId, filename);
        if (existing) {
          await trashDriveItem(activeToken, existing.id);
          await removeFileFromCache(existing.id);
          setLocalSyncNotice(`Lokálně smazaný soubor „${filename}“ byl přesunut do koše na Google Disku.`);
          setTimeout(() => setLocalSyncNotice(null), 5000);
          onRefreshNeededRef.current();
        }
      } catch (err) {
        console.error('Chyba při mazání souboru smazaného ve sledované složce:', err);
      }
    });

    return () => {
      if (typeof unsubscribeChange === 'function') {
        unsubscribeChange();
      }
      if (typeof unsubscribeDelete === 'function') {
        unsubscribeDelete();
      }
    };
  }, []);

  const selectWatchFolder = async () => {
    if (!window.electronAPI) return;
    const selected = await window.electronAPI.selectWatchFolder();
    if (selected) {
      setWatchFolderPath(selected);
      setIsWatchingLocalFolder(true);
    }
  };

  return {
    watchFolderPath,
    isWatchingLocalFolder,
    localSyncNotice,
    clearLocalSyncNotice: () => setLocalSyncNotice(null),
    selectWatchFolder,
  };
}
