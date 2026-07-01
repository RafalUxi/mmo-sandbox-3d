import * as THREE from "three";
import React, { useEffect } from "react";
import { useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { type GLTF, SkeletonUtils } from "three-stdlib";

type ActionName = "angry" | "dance1" | "dance2" | "tpose";

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

type GLTFResult = GLTF & {
  nodes: {
    Arm_Armor: THREE.SkinnedMesh;
    Belt: THREE.SkinnedMesh;
    Hand_Armor: THREE.SkinnedMesh;
    Knight: THREE.SkinnedMesh;
    Leg_Atmor: THREE.SkinnedMesh;
    Shoulder_Armor: THREE.SkinnedMesh;
    spine: THREE.Bone;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

export function KnightLoggingAnimation({ action = "dance1", ...props }) {
  const group = React.useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/knight_dance_front-transformed.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const current = actions[action];
    Object.values(actions).forEach((act) => {
      if (act && act !== current) {
        act.fadeOut(0.2);
      }
    });

    if (current) {
      current.reset().fadeIn(0.2).play();

      current.setEffectiveTimeScale(1);
      current.setEffectiveWeight(1);

      if (action === "dance1" || action === "dance2") {
        current.setLoop(THREE.LoopRepeat, Infinity);
      } else {
        current.setLoop(THREE.LoopOnce, 1);
        current.clampWhenFinished = true;
      }
    }
  }, [action, actions]);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Knight_metarig" position={[0, -0.004, 0]}>
          <primitive object={nodes.spine} />
          <skinnedMesh name="Arm_Armor" geometry={nodes.Arm_Armor.geometry} material={materials["Material.001"]} skeleton={nodes.Arm_Armor.skeleton} />
          <skinnedMesh name="Belt" geometry={nodes.Belt.geometry} material={materials["Material.001"]} skeleton={nodes.Belt.skeleton} />
          <skinnedMesh name="Hand_Armor" geometry={nodes.Hand_Armor.geometry} material={materials["Material.001"]} skeleton={nodes.Hand_Armor.skeleton} />
          <skinnedMesh name="Knight" geometry={nodes.Knight.geometry} material={materials["Material.001"]} skeleton={nodes.Knight.skeleton} />
          <skinnedMesh name="Leg_Atmor" geometry={nodes.Leg_Atmor.geometry} material={materials["Material.001"]} skeleton={nodes.Leg_Atmor.skeleton} />
          <skinnedMesh name="Shoulder_Armor" geometry={nodes.Shoulder_Armor.geometry} material={materials["Material.001"]} skeleton={nodes.Shoulder_Armor.skeleton} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/knight_dance_front-transformed.glb");
