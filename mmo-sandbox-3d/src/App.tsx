import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Stats } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import { PlayerController } from "../componenets/playerKeys";
import { GrassPos } from "./map/map_scripts/Grass_pos";
import { Mirror } from "./map/map_scripts/Mirror_pos";
import { GrzybPos } from "./map/map_scripts/Grzyb_pos";
import { Three } from "./map/Three";
import { MapCollider } from "./map/collider/MapCollider";

function App() {
  return (
    <div className="h-screen w-full bg-slate-900">
      <Canvas camera={{ position: [0, 5, 8] }}>
        <ambientLight intensity={10} color="#4a2480" />

        <pointLight position={[3, 0.5, 4]} color="#ff00aa" intensity={10} distance={3} decay={1} />
        <pointLight position={[3, 0.5, -3.2]} color="#ff00aa" intensity={10} distance={3} decay={1} />

        <Physics debug timeStep="vary">
          <MapCollider />
          <Stats />
          <PlayerController />
          <GrassPos />
          <Mirror />
          <GrzybPos />
          <Three />
        </Physics>

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