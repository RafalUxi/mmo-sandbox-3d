import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Object_4: THREE.Mesh;
  };
  materials: {
    Crystal_PBR: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function Metin(props: RigidBodyProps) {
  const { nodes, materials } = useGLTF("/metin-transformed.glb") as unknown as GLTFResult;
  return (
    <RigidBody userData={{ type: "Metin" }} {...props} type="fixed" colliders="hull" scale={[3, 3, 3]} position={[9, -1.2, 14]}>
      <mesh geometry={nodes.Object_4.geometry} material={materials.Crystal_PBR} />
    </RigidBody>
  );
}

useGLTF.preload("/metin-transformed.glb");
