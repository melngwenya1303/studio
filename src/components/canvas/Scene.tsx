'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Center } from '@react-three/drei';
import type { Device } from '@/lib/types';
import { LaptopModel } from './LaptopModel';
import { PhoneModel } from './PhoneModel';
import { HeadphonesModel } from './HeadphonesModel';

const models: Record<string, React.ComponentType<{ decalTexture?: any }>> = {
    Laptop: LaptopModel,
    Phone: PhoneModel,
    Headphones: HeadphonesModel,
};

function ModelScene({ deviceName, decalUrl }: { deviceName: string, decalUrl:string }) {
    const decalTexture = useTexture(decalUrl);
    decalTexture.flipY = false;
    const DeviceModel = models[deviceName];

    if (!DeviceModel) return null;

    return (
        <>
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <Center>
                <DeviceModel decalTexture={decalTexture} />
            </Center>
            <OrbitControls enableZoom={false} enablePan={false} />
        </>
    );
}

export function Scene({ deviceName, decalUrl }: { deviceName: string, decalUrl: string }) {
    return (
        <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }} dpr={[1, 2]}>
            <Suspense fallback={null}>
                <ModelScene deviceName={deviceName} decalUrl={decalUrl} />
            </Suspense>
        </Canvas>
    );
}
