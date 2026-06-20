import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function Orb() {
  const posicion = useMemo<[number, number, number][]>(
    () => [
      [2, 1, 2],
      [5, 1, 5],
      [9, 1, 3],
      [10, 1, 5],
      [14, 2, 6],
      [8, 1, 7],
      [8, 1, 20],
      [4, 2, 21],
      [2, 1, 20],

      //metin
      [5, 2, 14],
      [6, 3, 15],
      [7, 4, 15],
      [5, 2, 13],
      [8, 2, 13],
      [8, 2.5, 15],
    ],
    [],
  );
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.025, 6, 6), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        emissive: "#ff44aa",
        emissiveIntensity: 2,
      }),
    [],
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    posicion.forEach((pos, i) => {
      const y = pos[1] + Math.sin(time * 2 + i * 0.8) * 0.3;
      dummy.position.set(pos[0], y, pos[2]);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, 50]} frustumCulled={false} />;
}