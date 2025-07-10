
'use client';

export function PhoneModel({ decalTexture }: { decalTexture?: any }) {
     return (
        <mesh scale={1.5}>
            <boxGeometry args={[0.5, 1, 0.05]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.5} map={decalTexture} />
        </mesh>
    );
};
