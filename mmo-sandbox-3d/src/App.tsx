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
  // ruch - graczy online
  const otherPlayers = useRef(new Map<string, { x: number; y: number; z: number; action: string; rotation: number }>());
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Menu
  const [menu, setMenu] = useState<boolean>(true);
  const [register_menu, setRegister] = useState<boolean>(false);
  const [login_menu, setLogin] = useState<boolean>(false);
  const [chatInput_registger_password, setChatInput_registger_password] = useState<string>("");
  const [chatInput_registger_login, setChatInput_registger_login] = useState<string>("");
  const [chatInput_login_password, setChatInput_login_password] = useState<string>("");
  const [chatInput_login_login, setChatInput_login_login] = useState<string>("");
  const [token, setToken] = useState(localStorage.getItem("authToken"));

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

  if (!token) {
    return (
      <div className="relative">
        <nav className="fixed top-1/2 right-10 z-50 flex -translate-y-1/2 flex-col gap-4 text-white">
          <a href="#start" className="text-sm tracking-wide opacity-60 transition hover:opacity-100">
            Start
          </a>
          <a href="#gra" className="text-sm tracking-wide opacity-60 transition hover:opacity-100">
            Gra
          </a>
          <a href="#technologia" className="text-sm tracking-wide opacity-60 transition hover:opacity-100">
            Technologia
          </a>
          <a href="#o-tworcy" className="text-sm tracking-wide opacity-60 transition hover:opacity-100">
            O twórcy
          </a>
        </nav>

        <section id="start" className="relative flex h-screen w-full flex-col items-center" style={{ backgroundImage: "url('/hero.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black from-0% via-black/20 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-black/20 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-gradient-to-l from-black from-0% via-black/20 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-gradient-to-r from-black from-0% via-black/20 via-30% to-transparent to-50%" />

          <h1 className="pointer-events-none z-10 mt-20 text-9xl font-bold tracking-widest text-white" style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px rgba(180, 100, 255, 0.8), 0 0 60px rgba(180, 100, 255, 0.4)" }}>
            Monolit
          </h1>
          <p style={{ fontFamily: "'Raleway', sans-serif" }} className="pointer-events-none z-10 text-sm text-white">
            MMO przeglądarkowe - Każdy cios przybliża cię do legendy
          </p>

          <button
            className="absolute top-2/3 z-10 rounded-xl border border-purple-400 bg-black/40 px-8 py-4 text-xl tracking-widest text-white backdrop-blur-sm transition-all duration-300 hover:border-purple-300 hover:bg-purple-900/40"
            style={{
              fontFamily: "'Raleway', sans-serif",
              boxShadow: "0 0 25px rgba(168, 85, 247, 0.35), inset 0 0 25px rgba(168, 85, 247, 0.05)",
            }}
          >
            ▷ Zagraj już teraz
          </button>
        </section>

        <section id="gra" className="min-h-screen scroll-mt-20 bg-black text-white"></section>
        <section id="technologia" className="min-h-screen scroll-mt-20 bg-black text-white"></section>
        <section id="o-tworcy" className="min-h-screen scroll-mt-20 bg-black text-white"></section>
      </div>
    );
  }

  if (token)
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