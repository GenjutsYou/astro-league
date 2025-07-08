import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import Spaceship from '../components/spaceship/Spaceship';
import Stars from '../components/stars/Stars';

export default function QuickPlay() {
  return (
    <div style={{ width: '100%', height: '70vh' }}>
      <h2 className="astro-title">Quickplay</h2>
      <Canvas camera={{ position: [0, 3, -10], fov: 75 }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <Suspense fallback={null}>
          <Spaceship />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
