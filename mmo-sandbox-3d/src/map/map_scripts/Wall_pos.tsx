import { useMemo } from "react";
import { WallTexture } from "../Wall";

interface IWall {
  posicion: [number, number, number];
  rotation: [number, number, number];
}

export function Wall() {
  const posicionMemo = useMemo(() => {
    const posicion: IWall[] = [];

    posicion.push({ posicion: [0.5, -1, 12.5], rotation: [0, 0, 0] });

    posicion.push({ posicion: [8, -1, 23.5], rotation: [0, Math.PI / 2, 0] });

    posicion.push({ posicion: [16.5, -1, 12], rotation: [0, Math.PI, 0] });

    return posicion;
  }, []);

  return (
    <group>
      {posicionMemo.map((obj, index) => (
        <WallTexture key={index} position={obj.posicion} rotation={obj.rotation} scale={[11, 11, 25]} />
      ))}
    </group>
  );
}