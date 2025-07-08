import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Stars from '../stars/Stars';

// Laser component - fast-moving red dot
function Laser({ initialPosition, direction, onRemove }) {
  const ref = useRef();
  const position = useRef(initialPosition.clone());

  useFrame(() => {
    position.current.addScaledVector(direction, 10); // laser speed
    if (ref.current) {
      ref.current.position.copy(position.current);
    }
    if (position.current.length() > 2000) {
      onRemove();
    }
  });

  return (
    <mesh ref={ref} position={position.current}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}

export default function Spaceship() {
  // Mutable refs for physics calculations
  const positionRef = useRef(new THREE.Vector3(0, 0, 0));
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const rotationRef = useRef(new THREE.Quaternion());
  const angularVelocityRef = useRef(new THREE.Vector3(0, 0, 0)); // pitch, yaw, roll rates

  // React state for rendering position and rotation
  const [position, setPosition] = useState(new THREE.Vector3(0, 0, 0));
  const [rotationEuler, setRotationEuler] = useState(new THREE.Euler(0, 0, 0, 'XYZ'));

  // React state for lasers and boosting
  const [lasers, setLasers] = useState([]);
  const [boosting, setBoosting] = useState(false);

  // Keys pressed
  const keysPressed = useRef({});

  // Air roll active flag (true when Shift is held)
  const airRollActive = useRef(false);

  // Access camera from useThree
  const { camera } = useThree();

  // Handle keydown and keyup to track multiple keys pressed simultaneously
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      keysPressed.current[e.code] = true;

      // Air roll active while Shift is held
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        airRollActive.current = true;
      }

      // Shoot laser on "." key press
      if (e.code === 'Period') {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(rotationRef.current).normalize();
        const laserPos = positionRef.current.clone().add(forward.clone().multiplyScalar(1.2));
        setLasers((prev) => [
          ...prev,
          {
            key: Math.random(),
            initialPosition: laserPos,
            direction: forward,
          },
        ]);
      }

      // Boost on Space key down
      if (e.code === 'Space') {
        setBoosting(true);
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false;

      // Air roll deactivates when Shift is released
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        airRollActive.current = false;
      }

      // Stop boost on Space key up
      if (e.code === 'Space') {
        setBoosting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Remove laser by key
  const removeLaser = (key) => {
    setLasers((prev) => prev.filter((laser) => laser.key !== key));
  };

  // Physics constants
  const maxSpeed = 60;
  const acceleration = 50;
  const drag = 5;
  const angularAcceleration = 3;
  const angularDrag = 2;

  // For boost pulsation animation
  const boostPulse = useRef(0);

  useFrame((state, delta) => {
    // --- Rotation input ---
    // Pitch control (up/down arrows)
    if (keysPressed.current['ArrowUp']) {
      angularVelocityRef.current.x += angularAcceleration * delta; // pitch down
    }
    if (keysPressed.current['ArrowDown']) {
      angularVelocityRef.current.x -= angularAcceleration * delta; // pitch up
    }

    // Roll or yaw depending on air roll mode
    if (airRollActive.current) {
      // Air roll active: left/right arrows control roll (z-axis)
      if (keysPressed.current['ArrowRight']) {
        angularVelocityRef.current.z += angularAcceleration * delta; // roll left
      }
      if (keysPressed.current['ArrowLeft']) {
        angularVelocityRef.current.z -= angularAcceleration * delta; // roll right
      }
    } else {
      // Normal yaw control (left/right arrows)
      if (keysPressed.current['ArrowLeft']) {
        angularVelocityRef.current.y += angularAcceleration * delta; // yaw left
      }
      if (keysPressed.current['ArrowRight']) {
        angularVelocityRef.current.y -= angularAcceleration * delta; // yaw right
      }
    }

    // Apply angular drag
    angularVelocityRef.current.multiplyScalar(1 - angularDrag * delta);
    if (angularVelocityRef.current.length() < 0.0001) {
      angularVelocityRef.current.set(0, 0, 0);
    }

    // Update rotation quaternion
    const deltaRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        angularVelocityRef.current.x * delta,
        angularVelocityRef.current.y * delta,
        angularVelocityRef.current.z * delta,
        'XYZ'
      )
    );
    rotationRef.current.multiply(deltaRotation).normalize();

    // --- Linear movement ---
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(rotationRef.current).normalize();

    if (boosting) {
      velocityRef.current.add(forward.clone().multiplyScalar(acceleration * delta));
      if (velocityRef.current.length() > maxSpeed) {
        velocityRef.current.setLength(maxSpeed);
      }
    } else {
      const dragAmount = drag * delta;
      velocityRef.current.multiplyScalar(1 - dragAmount);
      if (velocityRef.current.length() < 0.01) {
        velocityRef.current.set(0, 0, 0);
      }
    }

    positionRef.current.add(velocityRef.current.clone().multiplyScalar(delta));

    // Update React state for rendering position and rotation
    setPosition(positionRef.current.clone());
    const euler = new THREE.Euler().setFromQuaternion(rotationRef.current, 'XYZ');
    setRotationEuler(euler);

    // --- Camera smoothly follows ship position and rotation ---
    const cameraOffset = forward.clone().multiplyScalar(-10).add(new THREE.Vector3(0, 3, 0));
    const desiredCameraPos = positionRef.current.clone().add(cameraOffset);
    camera.position.lerp(desiredCameraPos, 0.1);
    camera.lookAt(positionRef.current);

    // Update boost pulse for animation
    boostPulse.current = Math.sin(state.clock.elapsedTime * 20) * 0.3 + 1;
  });

  return (
    <>
      {/* Pass velocity to Stars for hyperspace effect */}
      <Stars shipVelocity={velocityRef.current} />

      {/* Apply both position AND rotation to the group */}
      <group position={position} rotation={rotationEuler}>
        {/* Spaceship body with widened and flattened scale for wings */}
        <mesh scale={[3, 1, 3]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2196f3" flatShading />
        </mesh>

        {/* Boost sphere at rear with pulsating animation */}
        {boosting && (
          <mesh position={[0, 0, -4]} scale={[boostPulse.current, boostPulse.current, boostPulse.current]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#ffeb3b" emissive="#fff176" />
          </mesh>
        )}
      </group>

      {/* Render lasers outside the ship group to avoid inheriting transforms */}
      {lasers.map((laser) => (
        <Laser
          key={laser.key}
          initialPosition={laser.initialPosition}
          direction={laser.direction}
          onRemove={() => removeLaser(laser.key)}
        />
      ))}
    </>
  );
}
