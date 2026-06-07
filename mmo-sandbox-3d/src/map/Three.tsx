import * as THREE from "three";
import React from "react";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Object_2: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function Three(props: React.ComponentProps<"group">) {
  const { nodes, materials } = useGLTF("/three-transformed.glb") as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Object_2.geometry} material={materials["Material.001"]} rotation={[-Math.PI / 2, 0, 0]} scale={0.201} />
    </group>
  );
}

useGLTF.preload("/three-transformed.glb");
