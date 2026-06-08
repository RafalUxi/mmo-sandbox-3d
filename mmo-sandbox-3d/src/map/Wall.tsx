import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Object_2: THREE.Mesh;
  };
  materials: {
    ["Scene_-_Root"]: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function WallTexture(props: RigidBodyProps) {
  const { nodes, materials } = useGLTF("/wall-transformed.glb") as unknown as GLTFResult;
  return (
    <RigidBody {...props} type="fixed" colliders="trimesh">
      <mesh geometry={nodes.Object_2.geometry} material={materials["Scene_-_Root"]} rotation={[-Math.PI / 2, 0, 0]} />
    </RigidBody>
  );
}

useGLTF.preload("/wall-transformed.glb");
