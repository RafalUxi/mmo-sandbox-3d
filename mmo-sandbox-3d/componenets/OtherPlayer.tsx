import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Knight } from "../src/animation/Knight";

interface OtherPlayersProps {
  id: string;
  posRef: React.RefObject<Map<string, { x: number; y: number; z: number; action: string; rotation: number }>>;
}

export function OtherPlayer({ id, posRef }: OtherPlayersProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [action, setAction] = useState<"attack" | "idle" | "run" | "slowrun" | "tpose" | "walk">("idle");
  const lastAnimation = useRef("idle");

  useFrame(() => {
    if (!groupRef.current) return;

    const pos = posRef.current?.get(id);

    if (!pos) return;

    groupRef.current.position.set(pos.x, pos.y, pos.z);
    groupRef.current.rotation.y = pos.rotation;

    if (pos.action !== lastAnimation.current) {
      setAction(pos.action as "attack" | "idle" | "run" | "slowrun" | "tpose" | "walk");
      lastAnimation.current = pos.action;
    }
  });
  return (
    <group ref={groupRef} scale={0.45}>
      <Knight action={action} />
    </group>
  );
}