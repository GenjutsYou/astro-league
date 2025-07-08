import React, { useRef, useEffect } from 'react';
import { Object3D, Color, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

function Stars({ count = 10000, radius = 500, exclusion = 100, shipVelocity }) {
  const meshRef = useRef();
  const dummy = useRef(new Object3D());

  // Store star positions for wrapping
  const starPositions = useRef([]);

  // Initialize star positions once
  useEffect(() => {
    if (!meshRef.current) return;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const positions = [];

    for (let i = 0; i < count; i++) {
      let pos;
      if (i % 2 === 0) {
        // Random sphere excluding center
        do {
          const r = Math.cbrt(Math.random()) * radius;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          pos = new Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
        } while (pos.length() < exclusion);
      } else {
        // Fibonacci sphere
        const y = 1 - (i / (count - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        pos = new Vector3(
          Math.cos(theta) * rad * radius,
          y * radius,
          Math.sin(theta) * rad * radius
        );
      }

      positions.push(pos);
      dummy.current.position.copy(pos);
      dummy.current.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.current.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    starPositions.current = positions;
  }, [count, radius, exclusion]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Move stars opposite to ship velocity scaled by delta
    // Increase speed multiplier if boosting for hyperspace effect
    const speedMultiplier = shipVelocity ? shipVelocity.length() / 20 : 0;
    const moveVector = shipVelocity ? shipVelocity.clone().multiplyScalar(-delta * (1 + speedMultiplier)) : new Vector3(0, 0, 0);

    // Update star positions
    const positions = starPositions.current;
    const dummyObj = dummy.current;

    for (let i = 0; i < count; i++) {
      positions[i].add(moveVector);

      // Wrap stars around if they go beyond radius sphere
      if (positions[i].length() > radius) {
        // Reposition star randomly inside sphere shell
        const direction = positions[i].clone().normalize();
        const newDistance = Math.random() * exclusion + exclusion;
        positions[i].copy(direction.multiplyScalar(-radius));
      }

      dummyObj.position.copy(positions[i]);
      dummyObj.updateMatrix();
      meshRef.current.setMatrixAt(i, dummyObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Black background plane far behind everything */}
      <mesh position={[0, 0, -radius - 100]}>
        <planeGeometry args={[radius * 4, radius * 4]} />
        <meshBasicMaterial color="black" side={2} />
      </mesh>
      <instancedMesh ref={meshRef} args={[null, null, count]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial vertexColors={false} color={new Color('white')} />
      </instancedMesh>
    </>
  );
}

export default Stars;
