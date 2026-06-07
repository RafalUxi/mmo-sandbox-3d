import * as THREE from "three";
import React from "react";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    grass_grass1_0: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function Cristal(props: React.ComponentProps<"group">) {
  const { nodes, materials } = useGLTF("/Cristal-transformed.glb") as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.grass_grass1_0.geometry} material={materials["Material.001"]} />
    </group>
  );
}

useGLTF.preload("/Cristal-transformed.glb");
