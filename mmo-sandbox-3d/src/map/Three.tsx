import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Object_2: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function Three(props: RigidBodyProps) {
  const { nodes, materials } = useGLTF("/three-transformed.glb") as unknown as GLTFResult;
  return (
    <RigidBody {...props} type="fixed" colliders="trimesh">
      <mesh geometry={nodes.Object_2.geometry} material={materials["Material.001"]} rotation={[-Math.PI / 2, 0, 0]} scale={1} />
    </RigidBody>
  );
}

useGLTF.preload("/three-transformed.glb");
