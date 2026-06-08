import { useMemo } from "react";
import { WallTexture } from "../Wall";

interface IWall {
  posicion: [number, number, number];
  rotation: [number, number, number];
}

export function Wall() {
  const posicionMemo = useMemo(() => {
    const posicion: IWall[] = [];

    posicion.push({ posicion: [7, -3, 25.5], rotation: [0, Math.PI, 0] });

    posicion.push({ posicion: [15, -3, 12], rotation: [0, Math.PI * 1.5, 0] });

    posicion.push({ posicion: [-1, -3, 12], rotation: [0, Math.PI / 2, 0] });

    return posicion;
  }, []);

  return (
    <group>
      {posicionMemo.map((obj, index) => (
        <WallTexture key={index} position={obj.posicion} rotation={obj.rotation} scale={[1, 1, 1]} />
      ))}
    </group>
  );
}