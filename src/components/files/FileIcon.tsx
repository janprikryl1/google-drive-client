import { FC } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { DriveItem } from '@/types/DriveItem';

type FileIconProps = {
  type: DriveItem['type'];
  className?: string;
};

export const FileIcon: FC<FileIconProps> = ({ type, className = 'h-8 w-8' }) => {
  switch (type) {
    case 'folder':
      return <Folder className={`${className} text-amber-500 fill-amber-500/20 shrink-0`} />;
    case 'document':
      return <FileText className={`${className} text-blue-500 shrink-0`} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={`${className} text-emerald-600 shrink-0`} />;
    case 'image':
      return <ImageIcon className={`${className} text-purple-500 shrink-0`} />;
    default:
      return <File className={`${className} text-muted-foreground shrink-0`} />;
  }
};
