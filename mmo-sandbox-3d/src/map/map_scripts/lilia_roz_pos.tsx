import { useMemo } from "react";
import { Lilia_roz } from "../Lilia_pojedyncza_roz";

interface ILilia {
  posicion: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function Lilia_roz_pos() {
  const pinkFlower = useMemo(() => {
    const posicion: ILilia[] = [];

    posicion.push({ posicion: [11, 0, 15], rotation: [0, 0, 0], scale: [0.018, 0.018, 0.018] });
    posicion.push({ posicion: [5, 0, 21], rotation: [0, 0, 0], scale: [0.018, 0.018, 0.018] });
    posicion.push({ posicion: [3, 0, 3], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });

    return posicion;
  }, []);

  const purpleFlower = useMemo(() => {
    const posicion: ILilia[] = [];

    posicion.push({ posicion: [9, 0, 19], rotation: [0, 0, 0], scale: [0.018, 0.018, 0.018] });
    posicion.push({ posicion: [3, 0, 20], rotation: [0, 0, 0], scale: [0.018, 0.018, 0.018] });

    posicion.push({ posicion: [5, 0, 8], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });
    posicion.push({ posicion: [8, 0, 8], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });
    posicion.push({ posicion: [1, 0, 8], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });
    posicion.push({ posicion: [2, 0, 10], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });
    posicion.push({ posicion: [3, 0, 14], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });

    return posicion;
  }, []);

  const magendaFlower = useMemo(() => {
    const posicion: ILilia[] = [];

    posicion.push({ posicion: [14, 0, 20], rotation: [0, 0, 0], scale: [0.018, 0.018, 0.018] });
    posicion.push({ posicion: [13, 0, 4], rotation: [0, 0, 0], scale: [0.018, 0.018, 0.018] });

    posicion.push({ posicion: [4, 0, 6], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });
    posicion.push({ posicion: [5, 0, 5], rotation: [0, 0, 0], scale: [0.01, 0.01, 0.01] });

    return posicion;
  }, []);

  return (
    <group>
      {pinkFlower.map((obj, index) => (
        <Lilia_roz key={index} position={obj.posicion} color="##ff1493" rotation={obj.rotation} scale={obj.scale} />
      ))}
      {purpleFlower.map((obj, index) => (
        <Lilia_roz key={`p${index}`} position={obj.posicion} color="#c875ff" rotation={obj.rotation} scale={obj.scale} />
      ))}

      {magendaFlower.map((obj, index) => (
        <Lilia_roz key={`m${index}`} position={obj.posicion} color="skyblue" rotation={obj.rotation} scale={obj.scale} />
      ))}
    </group>
  );
}