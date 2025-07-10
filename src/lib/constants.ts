import type { Device, Style, GalleryItem } from './types';

export const DEVICES: Omit<Device, 'model'>[] = [
    { name: 'Laptop', icon: 'Laptop' },
    { name: 'Phone', icon: 'Smartphone' },
    { name: 'Headphones', icon: 'Headphones' },
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
