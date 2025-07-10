
'use client';
import { Decal } from '@react-three/drei';

export function PhoneModel({ decalTexture }: { decalTexture?: any }) {
     return (
        <mesh scale={1.5}>
            <boxGeometry args={[0.5, 1, 0.05]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.5} />
            <Decal position={[0, 0, 0.03]} rotation={0} scale={[0.4, 0.8, 1]} map={decalTexture} />
        </mesh>
    );
};
