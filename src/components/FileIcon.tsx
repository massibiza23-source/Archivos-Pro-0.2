import { File, FileAudio, FileImage, FileText, FileVideo, Folder } from 'lucide-react';
import { FileType } from '../types';

interface FileIconProps {
  type: FileType;
  className?: string;
  size?: number;
}

export const FileIcon = ({ type, className, size = 24 }: FileIconProps) => {
  switch (type) {
    case 'folder':
      return <Folder className={className} size={size} />;
    case 'image':
      return <FileImage className={className} size={size} />;
    case 'video':
      return <FileVideo className={className} size={size} />;
    case 'audio':
      return <FileAudio className={className} size={size} />;
    case 'document':
      return <FileText className={className} size={size} />;
    default:
      return <File className={className} size={size} />;
  }
};
