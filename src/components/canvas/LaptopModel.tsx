
'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function LaptopModel({ decalTexture }: { decalTexture?: any }) {
    const group = useRef<any>();
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            group.current.rotation.y = Math.sin(t / 4) / 8;
        }
    });

    return (
        <group ref={group} dispose={null} scale={0.4}>
            <mesh position={[0, -0.75, 0]}>
                <boxGeometry args={[4, 0.1, 2.8]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.6, -1.3]} rotation={[1.4, 0, 0]}>
                <boxGeometry args={[4, 2.5, 0.1]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} map={decalTexture} />
            </mesh>
        </group>
    );
};
