import type { PhotoMeta, PhotoCollection, R2ListedPhoto } from './photos';

export interface AdminPhoto {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  meta: PhotoMeta | null;
}

export interface AdminPhotosResponse {
  photos: R2ListedPhoto[];
  total: number;
}

export interface AdminApiError {
  error?: string;
}

export type ReferenceList = { name: string }[];

export interface TagSummary {
  name: string;
  count: number;
}

export type { PhotoMeta, PhotoCollection, R2ListedPhoto };
