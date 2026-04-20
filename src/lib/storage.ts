import { get, set, del } from 'idb-keyval';
import { FileNode } from '../types';

const METADATA_KEY = 'archivopro_metadata';

export const storage = {
  getMetadata(): FileNode[] {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMetadata(nodes: FileNode[]) {
    localStorage.setItem(METADATA_KEY, JSON.stringify(nodes));
  },

  async getFileData(id: string): Promise<Blob | undefined> {
    return await get(id);
  },

  async saveFileData(id: string, data: Blob) {
    try {
      await set(id, data);
    } catch (err) {
      console.error('Error saving file to IDB:', err);
      throw new Error('No se pudo guardar el archivo. Puede que el almacenamiento esté lleno o bloqueado.');
    }
  },

  async deleteFileData(id: string) {
    try {
      await del(id);
    } catch (err) {
      console.error('Error deleting file from IDB:', err);
    }
  }
};

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const getMimeCategory = (mimeType: string): 'image' | 'video' | 'audio' | 'document' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};
