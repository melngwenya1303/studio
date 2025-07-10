'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Center } from '@react-three/drei';
import type { Device } from '@/lib/types';

function ModelScene({ device, decalUrl }: { device: Device, decalUrl: string }) {
    const decalTexture = useTexture(decalUrl);
    decalTexture.flipY = false;
    const DeviceModel = device.model;

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

export function Scene({ device, decalUrl }: { device: Device, decalUrl: string }) {
    return (
        <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }} dpr={[1, 2]}>
            <Suspense fallback={null}>
                <ModelScene device={device} decalUrl={decalUrl} />
            </Suspense>
        </Canvas>
    );
}
