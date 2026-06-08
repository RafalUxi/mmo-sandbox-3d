import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function MapCollider() {
  return (
    <RigidBody type="fixed">
      <CuboidCollider args={[8, 13, 0.15]} position={[7, 0, 12]} rotation={[Math.PI / 2, 0, 0]} /> //podloga
      <CuboidCollider args={[8, 5, 0.15]} position={[7, 5, 24.5]} rotation={[Math.PI, 0, 0]} />
      <CuboidCollider args={[8, 5, 0.15]} position={[7, 5, 0]} rotation={[Math.PI, 0, 0]} />
      <CuboidCollider args={[13, 5, 0.15]} position={[14.5, 5, 12]} rotation={[0, Math.PI / 2, 0]} />
      <CuboidCollider args={[13, 5, 0.15]} position={[-0.5, 5, 12]} rotation={[0, Math.PI / 2, 0]} />
    </RigidBody>
  );
}