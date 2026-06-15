import { useMemo } from "react";
import { Three } from "../Three";

interface IThree {
  posicion: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function ThreePos() {
  const posicionMemo = useMemo(() => {
    const posicion: IThree[] = [];

    posicion.push({ posicion: [12, 0, 5], rotation: [0, 0, 0], scale: [1, 1, 1] });

    posicion.push({ posicion: [12, 0, 19], rotation: [0, Math.PI / 2, 0], scale: [1.5, 1.5, 1.5] });

    return posicion;
  }, []);

  return (
    <group>
      {posicionMemo.map((obj, index) => (
        <Three key={index} position={obj.posicion} rotation={obj.rotation} scale={obj.scale} />
      ))}
    </group>
  );
}