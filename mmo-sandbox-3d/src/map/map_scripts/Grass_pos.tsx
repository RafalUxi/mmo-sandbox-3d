import { useMemo } from "react";
import { Cristal } from "../Cristal";

export function GrassPos() {
  const posicionMemo = useMemo(() => {
    const posicion: [number, number, number][] = [];
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 18; j++) {
        posicion.push([j * 1, 0, i * 1]);
      }
    }

    return posicion;
  }, []);
  return (
    <group>
      {posicionMemo.map((pos, i) => (
        <Cristal position={pos} key={i} scale={[1, 0.5, 1]} />
      ))}
    </group>
  );
}