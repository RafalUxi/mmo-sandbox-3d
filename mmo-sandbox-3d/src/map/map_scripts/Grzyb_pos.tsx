import { useMemo } from "react";
import { Grzyb } from "../Grzyb";

interface IGrzyb {
  posicion: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function GrzybPos() {
  const posicionMemo = useMemo(() => {
    const posicion: IGrzyb[] = [];

    posicion.push({ posicion: [10, 0, 7], rotation: [0, 0, 0], scale: [1, 1, 1] });

    //posicion.push({ posicion: [5.65, 1.3, 11.7], rotation: [0, Math.PI, 0] });

    //posicion.push({ posicion: [11.7, 1.3, 5.65], rotation: [0, -Math.PI / 2, 0] });

    //posicion.push({ posicion: [0, 1.3, 5.65], rotation: [0, Math.PI / 2, 0] });

    return posicion;
  }, []);

  return (
    <group>
      {posicionMemo.map((obj, index) => (
        <Grzyb key={index} position={obj.posicion} rotation={obj.rotation} scale={obj.scale} />
      ))}
    </group>
  );
}