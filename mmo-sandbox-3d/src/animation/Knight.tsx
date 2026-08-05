import * as THREE from "three";
import React, { useEffect } from "react";
import { useGraph, createPortal } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { type GLTF, SkeletonUtils } from "three-stdlib";

type ActionName = "attack" | "idle" | "run" | "slowrun" | "tpose" | "walk";

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

interface KnightProps {
  action?: ActionName;
  weapon?: string | null;
  [key: string]: any;
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
    handR: THREE.Bone;
  };
  materials: {
    ["Material.001"]: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

export function Knight({ action = "idle", weapon = null, ...props }: KnightProps) {
  const { scene: dlugi_miecz } = useGLTF("/długi_miecz.glb");
  const { scene: miecz_dusz } = useGLTF("/miecz_dusz.glb");
  const { scene: monolit_slayer } = useGLTF("/miecz.glb");

  const swordScane = weapon === "Długi Miecz" ? dlugi_miecz : weapon === "Miecz Dusz" ? miecz_dusz : weapon === "Monolit Slayer" ? monolit_slayer : null;

  const group = React.useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/knight.glb");

  const swordClone = React.useMemo(() => (swordScane ? swordScane.clone(true) : null), [swordScane]);
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

      if (action === "walk" || action === "idle" || action === "run" || action === "attack") {
        current.setLoop(THREE.LoopRepeat, Infinity);
      } else {
        current.setLoop(THREE.LoopOnce, 1);
        current.clampWhenFinished = true;
      }
    }
  }, [action, actions]);

  return (
    <group {...props} ref={group} dispose={null}>
      <group name="Scene">
        <group name="tpose" position={[0.085, -0.178, -0.084]} rotation={[0.27, -0.931, 0.209]}>
          <primitive object={nodes.spine} />

          {swordClone &&
            createPortal(
              <group position={[0, 0.07, 0.16]} rotation={[Math.PI / 2, Math.PI, 0]} scale={0.35}>
                <primitive object={swordClone} />
              </group>,
              nodes.handR,
            )}

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

useGLTF.preload("/knight.glb");
useGLTF.preload("/długi_miecz.glb");
useGLTF.preload("/miecz_dusz.glb");
useGLTF.preload("/miecz.glb");
