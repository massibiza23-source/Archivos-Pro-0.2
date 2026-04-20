export type FileType = 'image' | 'video' | 'audio' | 'document' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null; // null for root
  size: number;
  mimeType: string;
  createdAt: number;
  isFolder: boolean;
}

export interface FolderBreadcrumb {
  id: string;
  name: string;
}
