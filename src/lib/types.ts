
import type { ComponentType } from 'react';
import type { Timestamp } from 'firebase/firestore';

export type DecalDetails = {
  transform?: string;
  transformOrigin?: string;
  width: string;
  height: string;
  top: string;
  left: string;
}

export type DeviceModel = {
  name: string;
  previewImage: string;
  'data-ai-hint': string;
  decal?: DecalDetails;
}

export type Device = {
  name: string;
  icon: string;
  description: string;
  previewImage: string;
  'data-ai-hint': string;
  models?: DeviceModel[];
  decal?: DecalDetails;
  previewMode?: '2D' | '3D';
};

export type Style = {
  name: string;
  image: string;
  'data-ai-hint'?: string;
};

export type Creation = {
  id: string;
  url: string;
  prompt: string;
  style: string;
  title: string;
  deviceType: string;
  createdAt?: Timestamp | Date;
  userId?: string;
};

export type User = {
    uid: string;
    isAnonymous: boolean;
    email: string | null;
};

export type GalleryItem = {
    id: number;
    prompt: string;
    style: string;
    url: string;
    curatorNote: string;
    'data-ai-hint': string;
    likes: number;
};
