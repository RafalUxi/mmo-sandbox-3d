import { useMemo } from "react";
import { MirrorTest } from "../Mirror";

interface IMirror {
  posicion: [number, number, number];
  rotation: [number, number, number];
}

export function Mirror() {
  const posicionMemo = useMemo(() => {
    const posicion: IMirror[] = [];

    posicion.push({ posicion: [10, 2.5, 0], rotation: [0, 0, 0] });

    //posicion.push({ posicion: [5.65, 1.3, 11.7], rotation: [0, Math.PI, 0] });

    //posicion.push({ posicion: [11.7, 1.3, 5.65], rotation: [0, -Math.PI / 2, 0] });

    //posicion.push({ posicion: [0, 1.3, 5.65], rotation: [0, Math.PI / 2, 0] });

    return posicion;
  }, []);

  return (
    <group>
      {posicionMemo.map((obj, index) => (
        <MirrorTest key={index} position={obj.posicion} rotation={obj.rotation} scale={[22, 19, 1]} />
      ))}
    </group>
  );
}