import { useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Knight } from "../src/animation/Knight";
import { RapierRigidBody, RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";

interface ioProps {
  posicionChange: (newPosicion: { x: number; y: number; z: number; action: string; rotation: number }) => void;
  isMonolit: (isHitMonolit: { x: number; y: number; z: number }) => void;
  weapon: string | null;
}

export function PlayerController({ posicionChange, weapon, isMonolit }: ioProps) {
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
  const { world, rapier } = useRapier();
  const timer = useRef(0);
  const rapierBallHit = useMemo(() => new rapier.Ball(0.5), [rapier]);
  const hasHit = useRef(false);
  const attackAnimationTime: number = 1.5333333015441895;
  const rotationRef = useRef(0);
  const posicionChangeRef = useRef(posicionChange);

  useEffect(() => {
    posicionChangeRef.current = posicionChange;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (rbRef.current && playerRef.current) posicionChangeRef.current({ x: rbRef.current.translation().x, y: rbRef.current.translation().y, z: rbRef.current.translation().z, action: currentActionRef.current, rotation: rotationRef.current });
    }, 35);
    return () => {
      clearInterval(interval);
    };
  }, []);

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

    // timer do obsługi uderzenia
    if (isAttack) {
      timer.current += delta;
    } else timer.current = 0;

    const isHit = isAttack && timer.current > attackAnimationTime / 2 && timer.current < attackAnimationTime / 1.5;

    if (!isAttack) hasHit.current = false; // reset flagi jak !isAttack

    if (isAttack && timer.current > attackAnimationTime) {
      hasHit.current = false;
      timer.current = 0;
    }

    if (isHit && !hasHit.current) {
      cameraDirection.current.y = 0;

      const hitDirectionNormalize = cameraDirection.current.normalize();

      const hitObj = world.castShape(
        rbRef.current.translation(), // początek {x,y,z}
        { w: 1, x: 0, y: 0, z: 0 }, // orientacja kształtu — kwaternion { w, x, y, z }
        { x: hitDirectionNormalize.x, y: hitDirectionNormalize.y, z: hitDirectionNormalize.z }, // kierunek rzutu — znormalizowany wektor { x, y, z }
        rapierBallHit, // geometria kształtu
        0,
        3, // zasieg w jednostakch
        true, // czy zatrzymać się gdy shape startuje w kolizji — true
        undefined, // filterFlags
        undefined, // filterGroups
        undefined, // filterExcludeCollider
        rbRef.current, // filterExcludeRigidBody — wykluczasz własne ciało gracza
        (collider) => {
          // filterpredicate
          const data = collider.parent()?.userData as { type?: string };
          return data?.type === "Metin";
        },
      );

      if (hitObj !== null) {
        hasHit.current = true; //flaga uderzenia
        const parent = hitObj.collider.parent();
        const data = parent?.userData as { type?: string };

        if (data?.type === "Metin") {
          // trafiono Metina
          isMonolit({ x: rbRef.current.translation().x, y: rbRef.current.translation().y, z: rbRef.current.translation().z });
          console.log("Hit Metin! Distance:", hitObj.time_of_impact);
        }
      }
    }

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

    const speed = 4;

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
      rotationRef.current = rotate;
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

    const toCamera = state.camera.position.clone().sub(playerPos).normalize();
    const hitCamera = world.castRay(
      new rapier.Ray(playerPos, toCamera),
      5, // maxDistance = maxDistance OrbitControls
      true,
      undefined,
      undefined,
      undefined,
      rbRef.current, // exclude player
      (collider) => (collider.parent()?.userData as { type?: string })?.type === "wall",
    );
    if (hitCamera) {
      const newDistance = hitCamera.timeOfImpact - 0.2;
      state.camera.position.copy(playerPos).addScaledVector(toCamera, newDistance);
    }
  });

  return (
    <RigidBody type="dynamic" colliders={false} enabledRotations={[false, false, false]} ref={rbRef} position={[5, 2, 5]}>
      <CapsuleCollider args={[0.25, 0.15]} position={[0, 0.5, 0]} />
      <group ref={playerRef} scale={0.45}>
        <Knight action={currentAction} weapon={weapon} />
      </group>
    </RigidBody>
  );
}