
import type { Device, Style, GalleryItem } from './types';

export const DEVICES: Device[] = [
    { 
        name: 'Laptop', 
        icon: 'Laptop', 
        description: 'Skins for your mobile workstation.',
        models: [
            { 
                name: 'MacBook Air 13"', 
                previewImage: '/previews/macbook-air-13.png', 
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
                previewImage: '/previews/macbook-air-13.png', 
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
                previewImage: '/previews/macbook-air-13.png', 
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
        previewImage: '/previews/macbook-air-13.png',
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
        models: [
            { 
                name: 'iPhone 15 Pro', 
                previewImage: '/previews/iphone-15-pro.png', 
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
                previewImage: '/previews/iphone-15-pro.png', 
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
                previewImage: '/previews/iphone-15-pro.png', 
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
        previewImage: '/previews/iphone-15-pro.png', 
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
        models: [
            { 
                name: 'iPad Air', 
                previewImage: '/previews/ipad-air.png', 
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
                previewImage: '/previews/ipad-air.png', 
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
                previewImage: '/previews/ipad-air.png', 
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
        previewImage: '/previews/ipad-air.png', 
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
    { name: 'Photorealistic', image: '/styles/photorealistic.png', 'data-ai-hint': 'photorealistic woman' },
    { name: 'Anime', image: '/styles/anime.png', 'data-ai-hint': 'anime character' },
    { name: 'Cyberpunk', image: '/styles/cyberpunk.png', 'data-ai-hint': 'cyberpunk city' },
    { name: 'Dark Academia', image: '/styles/dark-academia.png', 'data-ai-hint': 'dark library' },
    { name: 'Cottagecore', image: '/styles/cottagecore.png', 'data-ai-hint': 'cozy cottage' },
    { name: 'Fantasy Art', image: '/styles/fantasy.png', 'data-ai-hint': 'fantasy landscape' },
];

export const GALLERY_ITEMS: GalleryItem[] = [
    { id: 1, prompt: "A majestic, bioluminescent stag with crystal antlers, standing in an enchanted forest under a starry nebula.", style: "Fantasy Art", url: "https://placehold.co/400x400.png", 'data-ai-hint': "stag forest", curatorNote: "A stunning piece that captures the essence of wonder. Try remixing this by changing the color of the nebula or the species of the animal.", likes: 1327 },
    { id: 2, prompt: "A lone astronaut discovering a glowing, ancient alien artifact on a desolate moon.", style: "Photorealistic", url: "https://placehold.co/400x400.png", 'data-ai-hint': "astronaut moon", curatorNote: "The sense of scale and isolation is palpable. What if the artifact was a different shape or color?", likes: 845 },
    { id: 3, prompt: "A bustling cyberpunk city street at night, with neon signs reflected in the rain-slicked pavement.", style: "Cyberpunk", url: "https://placehold.co/400x400.png", 'data-ai-hint': "cyberpunk city", curatorNote: "The vibrant chaos is mesmerizing. A different time of day could completely change the mood.", likes: 2109 },
    { id: 4, prompt: "A cozy, cluttered library in a cottage, with books stacked high and a cat sleeping by the fireplace.", style: "Dark Academia", url: "https://placehold.co/400x400.png", 'data-ai-hint': "library cat", curatorNote: "The warmth and comfort are perfectly captured. Try adding another animal or a different type of room.", likes: 988 },
];
