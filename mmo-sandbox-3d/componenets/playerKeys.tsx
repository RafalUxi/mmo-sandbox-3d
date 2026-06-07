import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Knight } from "../src/animation/Knight";

export function PlayerController() {
  const playerRef = useRef<THREE.Group>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false, space: false });
  const cameraDirection = useRef(new THREE.Vector3());
  const cameraRight = useRef(new THREE.Vector3());
  const currentActionRef = useRef<"attack" | "idle" | "run" | "slowrun" | "tpose" | "walk">("idle");
  const [currentAction, setCurrentAction] = useState<"attack" | "idle" | "run" | "slowrun" | "tpose" | "walk">("idle");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keys.current.w = true;
      if (e.code === "KeyA") keys.current.a = true;
      if (e.code === "KeyS") keys.current.s = true;
      if (e.code === "KeyD") keys.current.d = true;
      if (e.code === "Space") keys.current.space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keys.current.w = false;
      if (e.code === "KeyA") keys.current.a = false;
      if (e.code === "KeyS") keys.current.s = false;
      if (e.code === "KeyD") keys.current.d = false;
      if (e.code === "Space") keys.current.space = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const isMoving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    const isAttack = keys.current.space;
    if (isMoving && currentActionRef.current !== "walk" && !isAttack) {
      currentActionRef.current = "walk";
      setCurrentAction("walk");
    }
    if (!isMoving && currentActionRef.current !== "idle" && !isAttack) {
      currentActionRef.current = "idle";
      setCurrentAction("idle");
    }

    state.camera.getWorldDirection(cameraDirection.current); // Pobranie pozycji kamery

    cameraDirection.current.y = 0;
    cameraDirection.current.normalize();
    cameraRight.current.set(-cameraDirection.current.z, 0, cameraDirection.current.x); // Prostpopadły wektor do klawiszy a i d

    const speed = 7;

    let moveX = 0;
    let moveZ = 0;

    if (keys.current.w) {
      moveX += cameraDirection.current.x * speed * delta;
      moveZ += cameraDirection.current.z * speed * delta;
    }
    if (keys.current.s) {
      moveX -= cameraDirection.current.x * speed * delta;
      moveZ -= cameraDirection.current.z * speed * delta;
    }
    if (keys.current.a) {
      moveX -= cameraRight.current.x * speed * delta;
      moveZ -= cameraRight.current.z * speed * delta;
    }
    if (keys.current.d) {
      moveX += cameraRight.current.x * speed * delta;
      moveZ += cameraRight.current.z * speed * delta;
    }

    if (isMoving && playerRef.current) {
      const rotate = Math.atan2(moveX, moveZ);
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotate);
      playerRef.current.quaternion.slerp(targetQuaternion, 0.15); // obrót postaci jak idzie
    }

    if (isAttack) {
      moveX = 0;
      moveZ = 0;
      if (currentActionRef.current !== "attack") {
        currentActionRef.current = "attack";
        setCurrentAction("attack");
      }
    }

    playerRef.current.position.x += moveX;
    playerRef.current.position.z += moveZ;

    console.log(playerRef.current.position);

    state.camera.position.x += moveX;
    state.camera.position.z += moveZ;

    if (state.controls) {
      (state.controls as any).target.copy(new THREE.Vector3(playerRef.current.position.x, playerRef.current.position.y + 0.2, playerRef.current.position.z));
    }
  });

  return (
    <group ref={playerRef} scale={0.45} position={[2, 0, 2]}>
      <Knight action={currentAction} />
    </group>
  );
}