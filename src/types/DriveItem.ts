export type DriveItem = {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'spreadsheet' | 'image';
  size?: string;
  modified: string;
};

export type ExtendedDriveItem = DriveItem & {
  starred?: boolean;
  mimeType?: string;
  webViewLink?: string;
  modifiedTimeRaw?: string;
  isOfflineQueue?: boolean;
};

export type BreadcrumbItem = {
  id: string;
  name: string;
};

export type ClipboardState = {
  action: 'copy' | 'cut';
  items: ExtendedDriveItem[];
  sourceFolderId: string;
} | null;

export type OperationConflict = {
  type: 'rename' | 'paste';
  item: ExtendedDriveItem;
  existingItemName: string;
  onResolve: (choice: 'overwrite' | 'keep_both' | 'cancel') => void;
};
