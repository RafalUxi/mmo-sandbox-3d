import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
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

function App() {
  return (
    <div className="h-screen w-full bg-slate-900">
      <Canvas camera={{ position: [0, 5, 8] }}>
        <ambientLight intensity={10} color="#4a2480" />
        <color attach="background" args={["#000000"]} />

        <pointLight position={[7, 4, 14]} color="#ff00aa" intensity={50} distance={10} decay={2} />
        <pointLight position={[12, 3, 5]} color="#ff00aa" intensity={30} distance={8} decay={2} />

        {/* Modele mapy + kontroler postaci */}
        <Physics timeStep="vary">
          <Stats />
          <PlayerController />
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
      </Canvas>
    </div>
  );
}

export default App;