import {DriveItem} from "../types/DriveItem";

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
