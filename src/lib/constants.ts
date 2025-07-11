
import type { Device, Style, GalleryItem } from './types';

export const DEVICES: Device[] = [
    { 
        name: 'Laptop', 
        icon: 'Laptop', 
        description: 'Skins for your mobile workstation.',
        previewMode: '2D',
        models: [
            { 
                name: 'MacBook Air 13"', 
                previewImage: '/mockups/laptop-1.png', 
                'data-ai-hint': 'laptop back', 
                decal: {
                    top: '12%',
                    left: '17.5%',
                    width: '65%',
                    height: '75%',
                    transform: 'perspective(1500px) rotateX(50deg) scale(1)',
                    transformOrigin: 'top center',
                }
            },
            { 
                name: 'Surface Pro 15"', 
                previewImage: '/mockups/laptop-1.png', 
                'data-ai-hint': 'laptop back', 
                decal: {
                    top: '12%',
                    left: '17.5%',
                    width: '65%',
                    height: '75%',
                    transform: 'perspective(1500px) rotateX(50deg) scale(1)',
                    transformOrigin: 'top center',
                }
            },
            { 
                name: 'Dell XPS 16"', 
                previewImage: '/mockups/laptop-1.png', 
                'data-ai-hint': 'laptop back', 
                decal: {
                    top: '12%',
                    left: '17.5%',
                    width: '65%',
                    height: '75%',
                    transform: 'perspective(1500px) rotateX(50deg) scale(1)',
                    transformOrigin: 'top center',
                }
            },
        ],
        previewImage: '/mockups/laptop-1.png',
        'data-ai-hint': 'laptop back', 
        decal: {
            top: '12%',
            left: '17.5%',
            width: '65%',
            height: '75%',
            transform: 'perspective(1500px) rotateX(50deg) scale(1)',
            transformOrigin: 'top center',
        }
    },
    { 
        name: 'Phone', 
        icon: 'Smartphone', 
        description: 'Personalize your pocket companion.',
        previewMode: '2D',
        models: [
            { 
                name: 'iPhone 15 Pro', 
                previewImage: '/mockups/phone-1.png', 
                'data-ai-hint': 'phone back', 
                decal: {
                    top: '12%',
                    left: '12%',
                    width: '76%',
                    height: '76%',
                    transform: 'perspective(1000px) rotateX(0deg) scale(1)',
                }
            },
            { 
                name: 'Pixel 8 Pro', 
                previewImage: '/mockups/phone-1.png', 
                'data-ai-hint': 'phone back', 
                decal: {
                    top: '12%',
                    left: '12%',
                    width: '76%',
                    height: '76%',
                    transform: 'perspective(1000px) rotateX(0deg) scale(1)',
                }
            },
            { 
                name: 'Galaxy S24', 
                previewImage: '/mockups/phone-1.png', 
                'data-ai-hint': 'phone back', 
                decal: {
                    top: '12%',
                    left: '12%',
                    width: '76%',
                    height: '76%',
                    transform: 'perspective(1000px) rotateX(0deg) scale(1)',
                }
            },
        ],
        previewImage: '/mockups/phone-1.png', 
        'data-ai-hint': 'phone back', 
        decal: {
            top: '12%',
            left: '12%',
            width: '76%',
            height: '76%',
            transform: 'perspective(1000px) rotateX(0deg) scale(1)',
        }
    },
    { 
        name: 'Tablet', 
        icon: 'Tablet', 
        description: 'Decals for your digital canvas.',
        previewMode: '2D',
        models: [
            { 
                name: 'iPad Air', 
                previewImage: '/mockups/tablet-1.png', 
                'data-ai-hint': 'tablet back', 
                decal: {
                    top: '10%',
                    left: '10%',
                    width: '80%',
                    height: '80%',
                    transform: 'perspective(2000px) rotateX(30deg) scale(1)',
                }
            },
            { 
                name: 'Galaxy Tab S9', 
                previewImage: '/mockups/tablet-1.png', 
                'data-ai-hint': 'tablet back', 
                decal: {
                    top: '10%',
                    left: '10%',
                    width: '80%',
                    height: '80%',
                    transform: 'perspective(2000px) rotateX(30deg) scale(1)',
                }
            },
            { 
                name: 'Surface Go', 
                previewImage: '/mockups/tablet-1.png', 
                'data-ai-hint': 'tablet back', 
                decal: {
                    top: '10%',
                    left: '10%',
                    width: '80%',
                    height: '80%',
                    transform: 'perspective(2000px) rotateX(30deg) scale(1)',
                }
            },
        ],
        previewImage: '/mockups/tablet-1.png', 
        'data-ai-hint': 'tablet back', 
        decal: {
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            transform: 'perspective(2000px) rotateX(30deg) scale(1)',
        }
    },
];

export const STYLES: Style[] = [
    { name: 'Photorealistic', image: 'https://placehold.co/600x400.png', 'data-ai-hint': 'photorealistic woman' },
    { name: 'Anime', image: 'https://placehold.co/600x400.png', 'data-ai-hint': 'anime character' },
    { name: 'Cyberpunk', image: 'https://placehold.co/600x400.png', 'data-ai-hint': 'cyberpunk city' },
    { name: 'Dark Academia', image: 'https://placehold.co/600x400.png', 'data-ai-hint': 'dark library' },
    { name: 'Cottagecore', image: 'https://placehold.co/600x400.png', 'data-ai-hint': 'cozy cottage' },
    { name: 'Fantasy Art', image: 'https://placehold.co/600x400.png', 'data-ai-hint': 'fantasy landscape' },
];
