import {DriveItem} from "../types/DriveItem";
import {File, FileSpreadsheet, FileText, Folder, Image as ImageIcon} from "lucide-react";

export const getFileIcon = (type: DriveItem['type']) => {
    switch (type) {
        case 'folder':
            return '📁';
        case 'document':
            return '📄';
        case 'spreadsheet':
            return '📊';
        case 'image':
            return '🖼️';
        default:
            return '📎';
    }
};

export const renderIcon = (type: DriveItem['type']) => {
    switch (type) {
        case 'folder':
            return <Folder className="h-8 w-8 text-amber-500 fill-amber-100" />;
        case 'document':
            return <FileText className="h-8 w-8 text-blue-500" />;
        case 'spreadsheet':
            return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />;
        case 'image':
            return <ImageIcon className="h-8 w-8 text-purple-500" />;
        default:
            return <File className="h-8 w-8 text-gray-500" />;
    }
};
