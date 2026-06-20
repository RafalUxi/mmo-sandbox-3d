import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { type GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    waterPlant_wattaPlanto_matsy_0: THREE.Mesh;
  };
  materials: {
    ["wattaPlanto_matsy.001"]: THREE.MeshStandardMaterial;
  };
  animations: THREE.AnimationClip[];
};

interface colorLilia extends React.ComponentProps<"group"> {
  color?: string;
}

export function Lilia_roz({ color, ...props }: colorLilia) {
  const { nodes } = useGLTF("/Lilia_pojedyncza_roz-transformed.glb") as unknown as GLTFResult;
  return (
    <group {...props}>
      <mesh geometry={nodes.waterPlant_wattaPlanto_matsy_0.geometry}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/Lilia_pojedyncza_roz-transformed.glb");
