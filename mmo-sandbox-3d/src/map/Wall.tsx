import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    defaultMaterial: THREE.Mesh;
  };
  materials: {
    cave_wall: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function WallTexture(props: RigidBodyProps) {
  const { nodes, materials } = useGLTF("/wall-transformed.glb") as unknown as GLTFResult;
  return (
    <RigidBody {...props} type="fixed" colliders="trimesh">
      <mesh geometry={nodes.defaultMaterial.geometry} material={materials.cave_wall} />
    </RigidBody>
  );
}

useGLTF.preload("/wall-transformed.glb");
