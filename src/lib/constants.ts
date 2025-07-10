import type { Device, Style, GalleryItem } from './types';

export const DEVICES: Device[] = [
    { 
        name: 'Laptop', 
        icon: 'Laptop', 
        models: [
            { name: 'MacBook Air 13"', previewImage: 'https://placehold.co/800x500.png', 'data-ai-hint': 'laptop', previewWidth: 500, previewHeight: 300, decalWidth: 200, decalHeight: 120 },
            { name: 'Surface Pro 15"', previewImage: 'https://placehold.co/800x500.png', 'data-ai-hint': 'laptop', previewWidth: 500, previewHeight: 300, decalWidth: 250, decalHeight: 150 },
            { name: 'Dell XPS 16"', previewImage: 'https://placehold.co/800x500.png', 'data-ai-hint': 'laptop', previewWidth: 500, previewHeight: 300, decalWidth: 280, decalHeight: 170 },
        ],
        // Default values, can be removed if models are always present
        previewImage: 'https://placehold.co/800x500.png',
        'data-ai-hint': 'laptop', 
        previewWidth: 500, 
        previewHeight: 300, 
        decalWidth: 250, 
        decalHeight: 150
    },
    { 
        name: 'Phone', 
        icon: 'Smartphone', 
        models: [
            { name: 'iPhone 15 Pro', previewImage: 'https://placehold.co/400x800.png', 'data-ai-hint': 'phone', previewWidth: 200, previewHeight: 400, decalWidth: 140, decalHeight: 280 },
            { name: 'Pixel 8 Pro', previewImage: 'https://placehold.co/400x800.png', 'data-ai-hint': 'phone', previewWidth: 200, previewHeight: 400, decalWidth: 150, decalHeight: 300 },
            { name: 'Galaxy S24', previewImage: 'https://placehold.co/400x800.png', 'data-ai-hint': 'phone', previewWidth: 200, previewHeight: 400, decalWidth: 145, decalHeight: 290 },
        ],
        previewImage: 'https://placehold.co/400x800.png', 
        'data-ai-hint': 'phone', 
        previewWidth: 200, 
        previewHeight: 400, 
        decalWidth: 150, 
        decalHeight: 300 
    },
    { 
        name: 'Tablet', 
        icon: 'Tablet', 
        models: [
            { 
                name: 'iPad Air', 
                previewImage: 'https://placehold.co/600x800.png', 
                'data-ai-hint': 'tablet computer', 
                previewWidth: 300, 
                previewHeight: 400, 
                decal: {
                    transform: 'perspective(400px) rotateX(2deg) rotateY(-3.5deg) rotateZ(0.2deg) translateX(0px) translateY(0px)',
                    transformOrigin: 'center center',
                    width: '78.5%',
                    height: '84.5%',
                }
            },
            { 
                name: 'Galaxy Tab S9', 
                previewImage: 'https://placehold.co/600x800.png', 
                'data-ai-hint': 'tablet computer', 
                previewWidth: 300, 
                previewHeight: 400, 
                decal: {
                    transform: 'perspective(400px) rotateX(2deg) rotateY(-3.5deg) rotateZ(0.2deg) translateX(0px) translateY(0px)',
                    transformOrigin: 'center center',
                    width: '78.5%',
                    height: '84.5%',
                }
            },
            { 
                name: 'Surface Go', 
                previewImage: 'https://placehold.co/600x800.png', 
                'data-ai-hint': 'tablet computer', 
                previewWidth: 300, 
                previewHeight: 400, 
                decal: {
                    transform: 'perspective(400px) rotateX(2deg) rotateY(-3.5deg) rotateZ(0.2deg) translateX(0px) translateY(0px)',
                    transformOrigin: 'center center',
                    width: '78.5%',
                    height: '84.5%',
                }
            },
        ],
        previewImage: 'https://placehold.co/600x800.png', 
        'data-ai-hint': 'tablet computer', 
        previewWidth: 300, 
        previewHeight: 400, 
        decalWidth: 220, 
        decalHeight: 350 
    },
];

export const STYLES: Style[] = [
    { name: 'Photorealistic', image: 'https://placehold.co/400x300.png', 'data-ai-hint': 'realistic woman' },
    { name: 'Anime', image: 'https://placehold.co/400x300.png', 'data-ai-hint': 'anime character' },
    { name: 'Cyberpunk', image: 'https://placehold.co/400x300.png', 'data-ai-hint': 'cyberpunk city' },
    { name: 'Dark Academia', image: 'https://placehold.co/400x300.png', 'data-ai-hint': 'library book' },
    { name: 'Cottagecore', image: 'https://placehold.co/400x300.png', 'data-ai-hint': 'cottage garden' },
    { name: 'Fantasy Art', image: 'https://placehold.co/400x300.png', 'data-ai-hint': 'fantasy landscape' },
];

export const GALLERY_ITEMS: GalleryItem[] = [
    { id: 1, prompt: "A majestic, bioluminescent stag with crystal antlers, standing in an enchanted forest under a starry nebula.", style: "Fantasy Art", url: "https://placehold.co/400x400.png", 'data-ai-hint': "stag forest", curatorNote: "A stunning piece that captures the essence of wonder. Try remixing this by changing the color of the nebula or the species of the animal." },
    { id: 2, prompt: "A lone astronaut discovering a glowing, ancient alien artifact on a desolate moon.", style: "Photorealistic", url: "https://placehold.co/400x400.png", 'data-ai-hint': "astronaut moon", curatorNote: "The sense of scale and isolation is palpable. What if the artifact was a different shape or color?" },
    { id: 3, prompt: "A bustling cyberpunk city street at night, with neon signs reflected in the rain-slicked pavement.", style: "Cyberpunk", url: "https://placehold.co/400x400.png", 'data-ai-hint': "cyberpunk city", curatorNote: "The vibrant chaos is mesmerizing. A different time of day could completely change the mood." },
    { id: 4, prompt: "A cozy, cluttered library in a cottage, with books stacked high and a cat sleeping by the fireplace.", style: "Dark Academia", url: "https://placehold.co/400x400.png", 'data-ai-hint': "library cat", curatorNote: "The warmth and comfort are perfectly captured. Try adding another animal or a different type of room." },
];
