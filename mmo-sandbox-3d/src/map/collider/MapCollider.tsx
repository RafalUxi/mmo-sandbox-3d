import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function MapCollider() {
  return (
    <RigidBody type="fixed">
      <CuboidCollider args={[11.5, 13, 0.15]} position={[7, 0, 12]} rotation={[Math.PI / 2, 0, 0]} /> //podloga
      <RigidBody userData={{ type: "wall" }}>
        <CuboidCollider args={[11.5, 5, 0.15]} position={[7, 5, 0]} rotation={[Math.PI, 0, 0]} /> // szklo
      </RigidBody>
    </RigidBody>
  );
}