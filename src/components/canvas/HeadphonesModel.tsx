
'use client';

import * as THREE from 'three';
import { Decal } from '@react-three/drei';

export function HeadphonesModel({ decalTexture }: { decalTexture?: any }) {
    return (
        <group scale={1.5}>
            {/* Left Earcup */}
            <mesh position={[-0.3, 0, 0]}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} />
                <Decal position={[0, 0, 0.2]} rotation={[0,0,0]} scale={0.25} map={decalTexture} />
            </mesh>
            {/* Right Earcup */}
             <mesh position={[0.3, 0, 0]}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} />
                <Decal position={[0, 0, 0.2]} rotation={[0,0,0]} scale={0.25} map={decalTexture} />
            </mesh>
            {/* Headband */}
             <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.3, 0.02, 16, 100, Math.PI]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.4} />
            </mesh>
        </group>
    );
};
