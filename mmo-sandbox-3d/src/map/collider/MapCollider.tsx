import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function MapCollider() {
  return (
    <RigidBody type="fixed">
      <CuboidCollider args={[8, 13, 0.15]} position={[7, -0.15, 12]} rotation={[Math.PI / 2, 0, 0]} />
    </RigidBody>
  );
}