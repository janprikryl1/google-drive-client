export type DriveItem = {
    id: string;
    name: string;
    type: 'folder' | 'document' | 'spreadsheet' | 'image';
    size?: string;
    modified: string;
}
