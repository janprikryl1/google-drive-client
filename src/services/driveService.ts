import { ExtendedDriveItem } from '@/types/DriveItem';

export async function searchFolderByName(
  token: string,
  folderName: string
): Promise<{ id: string; name: string } | null> {
  const query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) throw new Error('Chyba při vyhledávání složky na Google Disku');
  const data = await res.json();
  return data.files?.[0] || null;
}

export async function fetchFolderContents(
  token: string,
  folderId: string
): Promise<ExtendedDriveItem[]> {
  const query = `'${folderId}' in parents and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&pageSize=100&fields=files(id,name,mimeType,size,modifiedTime,starred,webViewLink)&orderBy=folder,name`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) throw new Error('Chyba při načítání souborů ze složky');
  const data = await res.json();

  return (data.files || []).map((f: any): ExtendedDriveItem => {
    let itemType: ExtendedDriveItem['type'] = 'document';
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
  });
}

export async function createDriveFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<{ id: string; name: string }> {
  const body: Record<string, any> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    body.parents = [parentId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Nepodařilo se vytvořit složku');
  return res.json();
}

export async function uploadMultipartFile(
  token: string,
  name: string,
  parentId: string,
  mimeType: string,
  blob: Blob
): Promise<{ id: string; name: string }> {
  const metadata = { name, parents: [parentId] };
  const boundary = `-------boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
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

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) throw new Error(`Chyba při nahrávání souboru: ${await res.text()}`);
  return res.json();
}

export async function updateDriveFileContent(
  token: string,
  fileId: string,
  mimeType: string,
  blob: Blob
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType || 'application/octet-stream',
      },
      body: blob,
    }
  );

  if (!res.ok) throw new Error('Nepodařilo se aktualizovat obsah souboru');
}

export async function downloadDriveBlob(
  token: string,
  fileId: string,
  mimeType?: string
): Promise<Blob> {
  let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  if (mimeType?.startsWith('application/vnd.google-apps.')) {
    if (mimeType.includes('spreadsheet')) {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    } else {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    }
  }

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    if (
      res.status === 403 ||
      errorJson?.error?.errors?.[0]?.reason === 'appNotAuthorizedToFile'
    ) {
      throw new Error('AUTH_FORBIDDEN');
    }
    throw new Error('DOWNLOAD_FAILED');
  }

  return res.blob();
}

export async function renameDriveItem(
  token: string,
  fileId: string,
  newName: string
): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!res.ok) throw new Error('Nepodařilo se přejmenovat položku');
}

export async function copyDriveFile(
  token: string,
  fileId: string,
  newName: string,
  targetFolderId: string
): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: newName,
      parents: [targetFolderId],
    }),
  });

  if (!res.ok) throw new Error('Nepodařilo se zkopírovat soubor');
}

export async function moveDriveItem(
  token: string,
  fileId: string,
  targetFolderId: string,
  sourceFolderId: string,
  newName?: string
): Promise<void> {
  const body: Record<string, any> = {};
  if (newName) body.name = newName;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${targetFolderId}&removeParents=${sourceFolderId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error('Nepodařilo se přesunout položku');
}

export async function trashDriveItem(token: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  });

  if (!res.ok) throw new Error('Nepodařilo se přesunout položku do koše');
}

export async function toggleDriveStar(
  token: string,
  fileId: string,
  starred: boolean
): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ starred }),
  });
}

export async function findConflictingFile(
  token: string,
  parentId: string,
  name: string
): Promise<{ id: string; name: string; modifiedTime: string; size?: string } | null> {
  const escapedName = name.replace(/'/g, "\\'");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `'${parentId}' in parents and name = '${escapedName}' and trashed = false`
    )}&fields=files(id,name,modifiedTime,size)&pageSize=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0] || null;
}
