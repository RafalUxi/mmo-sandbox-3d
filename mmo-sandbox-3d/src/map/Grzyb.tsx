import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Object_1: THREE.Mesh;
    Object_1_1: THREE.Mesh;
  };
  materials: {
    aiStandardSurface2SG: THREE.MeshStandardMaterial;
    aiStandardSurface1SG: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

export function Grzyb(props: RigidBodyProps) {
  const { nodes, materials } = useGLTF("/grzyb-transformed.glb") as unknown as GLTFResult;
  return (
    <RigidBody {...props} type="fixed" colliders="hull">
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={nodes.Object_1.geometry} material={materials.aiStandardSurface2SG} />
        <mesh geometry={nodes.Object_1_1.geometry} material={materials.aiStandardSurface1SG} />
      </group>
    </RigidBody>
  );
}

useGLTF.preload("/grzyb-transformed.glb");
