import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Knight } from "../src/animation/Knight";
import { RapierRigidBody, RigidBody, CapsuleCollider } from "@react-three/rapier";

export function PlayerController() {
  const playerRef = useRef<THREE.Group>(null);
  const rbRef = useRef<RapierRigidBody>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false, space: false });
  const cameraDirection = useRef(new THREE.Vector3());
  const cameraRight = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const baseVecRef = useRef(new THREE.Vector3(0, 1, 0));
  const targetQuaternion = useRef(new THREE.Quaternion());
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

  useFrame((state) => {
    if (!playerRef.current) return;
    if (!rbRef.current) return;

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
    direction.current.set(0, 0, 0);
    if (keys.current.w) direction.current.add(cameraDirection.current);
    if (keys.current.s) direction.current.sub(cameraDirection.current);
    if (keys.current.a) direction.current.sub(cameraRight.current);
    if (keys.current.d) direction.current.add(cameraRight.current);

    direction.current.y = 0;
    if (direction.current.lengthSq() > 0) direction.current.normalize();

    const speed = 7;

    const currentV = rbRef.current.linvel(); // zmienna przechowuje weketor ruchu w klatce
    const yVel = Math.min(currentV.y, 0);

    if (isAttack && currentActionRef.current !== "attack") {
      currentActionRef.current = "attack";
      setCurrentAction("attack");
    }

    if (isMoving && !isAttack) {
      rbRef.current.setLinvel({ x: direction.current.x * speed, y: yVel, z: direction.current.z * speed }, true);
    } else {
      rbRef.current.setLinvel({ x: 0, y: yVel, z: 0 }, true);
    }

    if (isMoving) {
      const rotate = Math.atan2(direction.current.x, direction.current.z);
      targetQuaternion.current.setFromAxisAngle(baseVecRef.current, rotate);
      playerRef.current.quaternion.slerp(targetQuaternion.current, 0.15); // obrót postaci jak idzie
    }

    const playerPos = rbRef.current.translation();

    if (state.controls) {
      const controlsTarget = (state.controls as any).target;

      // Obliczamy o ile przesunął się gracz w tej klatce
      const diffX = playerPos.x - controlsTarget.x;
      const diffZ = playerPos.z - controlsTarget.z;
      state.camera.position.x += diffX;
      state.camera.position.z += diffZ;

      // Ustawiamy nowy punkt patrenia
      controlsTarget.set(playerPos.x, playerPos.y + 0.2, playerPos.z);
    }
  });

  return (
    <RigidBody type="dynamic" restitution={0} colliders={false} enabledRotations={[false, false, false]} ref={rbRef} position={[2, 2, 2]}>
      <CapsuleCollider args={[0.25, 0.15]} position={[0, 0.5, 0]} />
      <group ref={playerRef} scale={0.45}>
        <Knight action={currentAction} />
      </group>
    </RigidBody>
  );
}