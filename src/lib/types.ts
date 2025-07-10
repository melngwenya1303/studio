import type { ComponentType } from 'react';

export type Device = {
  name: string;
  icon: string;
  model: ComponentType<{ decalTexture?: any }>;
};

export type Style = {
  name: string;
  image: string;
};

export type Creation = {
  id: string;
  url: string;
  prompt: string;
  style: string;
  title: string;
  deviceType: string;
  createdAt?: any;
};

export type User = {
    uid: string;
    isAnonymous: boolean;
};

export type GalleryItem = {
    id: number;
    prompt: string;
    style: string;
    url: string;
    curatorNote: string;
    'data-ai-hint': string;
};
