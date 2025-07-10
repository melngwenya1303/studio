
'use client';

export function HeadphonesModel({ decalTexture }: { decalTexture?: any }) {
    return (
        <group scale={1.5}>
            <mesh position={[-0.3, 0, 0]}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} map={decalTexture} />
            </mesh>
             <mesh position={[0.3, 0, 0]}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} map={decalTexture} />
            </mesh>
             <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.35, 0.02, 16, 100]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.4} />
            </mesh>
        </group>
    );
};
