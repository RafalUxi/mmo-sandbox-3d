import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Cylinder004_Material001_0: THREE.Mesh;
  };
  materials: {
    ["Material.002"]: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function Plant(props: RigidBodyProps) {
  const { nodes, materials } = useGLTF("/plant-transformed.glb") as unknown as GLTFResult;
  return (
    <RigidBody {...props} userData={{ type: "plant" }} type="fixed" colliders="trimesh" scale={[0.5, 0.5, 0.5]} position={[12, 0, 18]} rotation={[0, Math.PI, 0]}>
      <mesh geometry={nodes.Cylinder004_Material001_0.geometry} material={materials["Material.002"]} />
    </RigidBody>
  );
}

useGLTF.preload("/plant-transformed.glb");
