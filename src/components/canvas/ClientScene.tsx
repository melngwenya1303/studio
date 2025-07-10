'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Center } from '@react-three/drei';
import Icon from '@/components/shared/icon';

const LaptopModel = dynamic(() => import('./LaptopModel').then(mod => mod.LaptopModel), { ssr: false });
const PhoneModel = dynamic(() => import('./PhoneModel').then(mod => mod.PhoneModel), { ssr: false });
const HeadphonesModel = dynamic(() => import('./HeadphonesModel').then(mod => mod.HeadphonesModel), { ssr: false });

const modelPaths: Record<string, React.ComponentType<{ decalTexture?: any }>> = {
    Laptop: LaptopModel,
    Phone: PhoneModel,
    Headphones: HeadphonesModel,
};

function ModelScene({ deviceName, decalUrl }: { deviceName: string, decalUrl: string }) {
    const DeviceModel = useMemo(() => modelPaths[deviceName] || null, [deviceName]);
    
    if (!DeviceModel) return null;

    return (
        <>
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <Center>
                <TexturedModel DeviceModel={DeviceModel} decalUrl={decalUrl} />
            </Center>
            <OrbitControls enableZoom={false} enablePan={false} />
        </>
    );
}

function TexturedModel({ DeviceModel, decalUrl }: { DeviceModel: React.ComponentType<{ decalTexture?: any }>, decalUrl: string }) {
    const decalTexture = useTexture(decalUrl);
    decalTexture.flipY = false;
    
    return <DeviceModel decalTexture={decalTexture} />;
}

export default function ClientScene({ deviceName, decalUrl }: { deviceName: string, decalUrl: string }) {
    return (
        <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }} dpr={[1, 2]}>
            <Suspense fallback={
                <Center>
                    <Icon name="Laptop" className="w-16 h-16 animate-pulse text-primary" />
                </Center>
            }>
                <ModelScene deviceName={deviceName} decalUrl={decalUrl} />
            </Suspense>
        </Canvas>
    );
}
