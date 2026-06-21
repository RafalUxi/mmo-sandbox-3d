import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useRef, useState } from "react";
import { Stats } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import { PlayerController } from "../componenets/playerKeys";
import { GrassPos } from "./map/map_scripts/Grass_pos";
import { Mirror } from "./map/map_scripts/Mirror_pos";
import { GrzybPos } from "./map/map_scripts/Grzyb_pos";
import { ThreePos } from "./map/map_scripts/Three_pos";
import { MapCollider } from "./map/collider/MapCollider";
import { Wall } from "./map/map_scripts/Wall_pos";
import { Metin } from "./map/Metin";
import { Orb } from "./map/orb";
import { Plant } from "./map/Plant";
import { Lilia_roz_pos } from "./map/map_scripts/lilia_roz_pos";
import { OtherPlayer } from "../componenets/OtherPlayer";

function App() {
  const otherPlayers = useRef(new Map<string, { x: number; y: number; z: number; action: string; rotation: number }>());
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("playerMove", (dane) => {
      if (dane.id !== socketRef.current?.id) {
        setPlayerIds((prev) => (prev.includes(dane.id) ? prev : [...prev, dane.id]));
        otherPlayers.current.set(dane.id, { x: dane.x, y: dane.y, z: dane.z, action: dane.action, rotation: dane.rotation });
      }
    });

    socketRef.current.on("disconnectPlayer", (dane) => {
      otherPlayers.current.delete(dane.id);
      setPlayerIds((prev) => prev.filter((id) => id !== dane.id));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="h-screen w-full bg-slate-900">
      <Canvas camera={{ position: [0, 5, 8] }}>
        <ambientLight intensity={10} color="#4a2480" />
        <color attach="background" args={["#000000"]} />

        <pointLight position={[7, 4, 14]} color="#ff00aa" intensity={50} distance={10} decay={2} />
        <pointLight position={[12, 3, 5]} color="#ff00aa" intensity={30} distance={8} decay={2} />

        {/* Modele mapy + kontroler postaci */}
        <Physics timeStep="vary">
          <PlayerController posicionChange={(newPos) => socketRef.current?.emit("sendMessage", { type: "move", ...newPos })} />
          <Stats />
          <MapCollider />
          <GrassPos />
          <Mirror />
          <ThreePos />
          <GrzybPos />
          <Metin />
          <Wall />
          <Plant />
        </Physics>

        {/* części mapy bez hitboxow */}
        <Orb />
        <Lilia_roz_pos />

        {/* Kontroler danych ruchu */}

        <EffectComposer>
          <Bloom
            intensity={0.3} // Siła blasku neonu
            luminanceThreshold={0.1} // Jak jasny musi być obiekt, żeby zaczął świecić (niska wartość = łatwiejszy neon)
            luminanceSmoothing={0.9} // Gładkość przejścia blasku
          />
        </EffectComposer>

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} maxDistance={5} />

        {playerIds.map((id) => (
          <OtherPlayer key={id} id={id} posRef={otherPlayers} />
        ))}
      </Canvas>
    </div>
  );
}

export default App;