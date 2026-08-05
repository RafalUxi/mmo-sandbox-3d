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
import gameplayimg_1 from "./graphics/gameplayimg_1.png";
import Profil from "./graphics/Profil.jpg";
import CasinoImg from "./graphics/Casino.png";
import CasinoExit from "./graphics/CasinoEXT.png";
import GoldUI from "./graphics/UI/ikonaGold.png";
import CasinoUI from "./graphics/UI/ikonaCas.png";
import CzatUI from "./graphics/UI/ikonaCzat.png";
import EqUI from "./graphics/UI/ikonaEkwipunek.png";
import ShopUI from "./graphics/UI/ikonaSklep.png";
import ShopImg from "./graphics/sklep.png";
import EqImg from "./graphics/eq.png";
import chat from "./graphics/chat.png";
import dlugi_miecz from "./graphics/swords/długi_miecz.png";
import miecz_dusz from "./graphics/swords/Miecz_dusz.png";
import monolit_slayer from "./graphics/swords/monolit_slayer.png";
import dlugi_miecz_fixed from "./graphics/swords/długi_miecz_fixed.png";
import miecz_dusz_fixed from "./graphics/swords/miecz_dusz_fixed.png";

import monolit_slayer_fixed from "./graphics/swords/monolit_slayer_fixed.png";
import { SiGit, SiOpengl, SiThreedotjs, SiJavascript, SiBlender, SiReact, SiNodedotjs, SiSocketdotio, SiTypescript, SiSupabase, SiTailwindcss } from "react-icons/si";
import { TbBox } from "react-icons/tb";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { KnightLoggingAnimation } from "./animation/Knight_dance_front";
import { FiUser, FiLock, FiSend } from "react-icons/fi";
import { fetchPlayerStats, buyItem, fetchPutOnItem, fetchTakeOffItem, fetchUpgradeItem } from "./fetch/player";
import { type IItem, type IShop, type IMessage } from "../../shared/types";
import { shopList } from "../../shared/ItemsList";

function App() {
  // ruch - graczy online
  const otherPlayers = useRef(new Map<string, { x: number; y: number; z: number; action: string; rotation: number }>());
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Pierwsza strona do wyświetlenia
  const [frontPage, setfrontPage] = useState<boolean>(true);

  // Menu
  const [login_menu, setLogin] = useState<boolean>(true);
  const [register_menu, setRegister] = useState<boolean>(false);
  const [errMessageLogin, seterrMessageLogin] = useState<string>("");
  const [errMessageRegister, seterrMessageRegister] = useState<string>("");
  const [alertLogin, setAlertLogin] = useState<boolean>(false);
  const [alertRegister, setAlertRegister] = useState<boolean>(false);
  const [chatInput_register_password, setChatInput_register_password] = useState<string>("");
  const [chatInput_register_login, setChatInput_register_login] = useState<string>("");
  const [chatInput_login_password, setChatInput_login_password] = useState<string>("");
  const [chatInput_login_login, setChatInput_login_login] = useState<string>("");

  // UI - EQ
  const [isOpenEq, setIsOpenEq] = useState<boolean>(false);
  const [isContextMenu, setIsContextMenu] = useState<boolean>(false);
  const [infoSword, setInfoSword] = useState<string>("");
  const [putOnItem, setPutOnItem] = useState<IItem[] | null>(null);
  const [hoveredItem, setHoveredItem] = useState<IItem | null>(null);
  const [isWinUpgrade, setIsWinUpgrade] = useState<string | null>(null);

  const [upgradeItemHover, setUpgradeItemHover] = useState<IItem[] | null>(null);

  // UI - Shop
  const [isOpenShop, setIsOpenShop] = useState<boolean>(false);

  // UI - Chat - friends
  const [isOpenChat, setIsOpenChat] = useState<boolean>(false);
  const [addFriend, setAddFriend] = useState<string>("");
  const [friendsList, setFriendsList] = useState<string[] | null>([]);
  const [addFriendsError, setAddFriendError] = useState<string | null>(null);
  const [friendAccept, setFriendAccept] = useState<string | null>(null);
  // UI - Chat open
  const [roomMessages, setRoomMessages] = useState<IMessage[] | null>(null);
  const [message, setMessage] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  // UI - casino
  const [isOpenCasino, setIsOpenCasino] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [goldInput, setGoldInput] = useState<number>(10);
  const [isLosuj, setIsLosuj] = useState<boolean>(true);
  const [casinoErr, setCasinoErr] = useState<boolean>(false);
  const [isWinCasino, setIsWinCasino] = useState<string | null>(null);

  // Autoryzacja
  const [token, setToken] = useState(localStorage.getItem("authToken"));

  // Gameplay
  const [news, setNews] = useState<string | null>(null);
  const [gold, setGold] = useState<number>(100);
  const [inventory, setInventory] = useState<IItem[]>([]);

  // Ogólne
  const [playerUserName, setPlayerUserName] = useState<string | null>(null);
  const [messageTargetName, setMessageTargetName] = useState<string | null>(null);

  const stack = [
    { name: "React Three Fiber", Icon: SiReact, color: "#61DAFB" },
    { name: "JavaScript", Icon: SiJavascript, color: "#FFBF00" },
    { name: "Tailwind CSS", Icon: SiTailwindcss, color: "#38BDF8" },
    { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
    { name: "Node.js", Icon: SiNodedotjs, color: "#5FA04E" },
    { name: "Socket.IO", Icon: SiSocketdotio, color: "#FFFFFF" },
    { name: "Three.js", Icon: SiThreedotjs, color: "#FFFFFF" },
    { name: "Rapier", Icon: TbBox, color: "#C084FC" },
    { name: "GLSL", Icon: SiOpengl, color: "#5586A4" },
    { name: "Supabase", Icon: SiSupabase, color: "#3FCF8E" },
    { name: "Blender", Icon: SiBlender, color: "#E97451" },
    { name: "Git", Icon: SiGit, color: "#F05032" },
  ];

  // START GRY - Pobieramy wszystko z serwera
  useEffect(() => {
    if (!token) return setfrontPage(true);

    const load = async () => {
      const playerData = await fetchPlayerStats(token);
      setGold(playerData.gold);
      setFriendsList(playerData.list);
      setPlayerUserName(playerData.username);

      const equippedItem = playerData.inventory.find((i: IItem) => i.czyzalozony === true);

      if (equippedItem) {
        setPutOnItem([equippedItem]);
        setInventory(playerData.inventory.map((i: IItem) => (i.czyzalozony ? { ...i, ilosc: i.ilosc - 1 } : i)).filter((i: IItem) => i.ilosc > 0));
      } else {
        setInventory(playerData.inventory);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io("http://localhost:5000", { auth: { token: token } });

    socketRef.current.on("playerMove", (dane) => {
      if (dane.id !== socketRef.current?.id) {
        setPlayerIds((prev) => (prev.includes(dane.id) ? prev : [...prev, dane.id]));
        otherPlayers.current.set(dane.id, { x: dane.x, y: dane.y, z: dane.z, action: dane.action, rotation: dane.rotation });
      }
    });

    socketRef.current.on("casinoResult", (dane) => {
      if (dane.success === true) {
        setCasinoErr(false);
        setGold(dane.gold);
        if (dane.message === "Crash") {
          setIsWinCasino(`Przegrałeś zakład`);
          setTimeout(() => setIsWinCasino(null), 1500);
          setIsLosuj(true);
        }
        if (dane.message === "Win") {
          setIsWinCasino(`Wygrałeś ${dane.winGold} golda!`);
          setTimeout(() => setIsWinCasino(null), 1500);
        }
      } else if (dane.success === false) {
        setCasinoErr(true);
        setIsLosuj(true);
        console.log(dane.message);
      }
    });

    socketRef.current.on("addFriendsResult", (dane) => {
      if (dane.type === "error") {
        console.log(dane.message);
        setAddFriendError(dane.message);
        setTimeout(() => setAddFriendError(null), 1500);
      }
      if (dane.success === true) {
        setNews(dane.message);
        setTimeout(() => setNews(null), 1500);
      }
      if (dane.type === "errorChat") {
        setNews(dane.message);
        setTimeout(() => setNews(null), 1500);
      }
      if (dane.type === "addFriend") {
        console.log(dane.message);
        setFriendsList(dane.list);
      }
    });

    socketRef.current.on("addFriendsRequest", (dane) => {
      if (dane.success === true && dane.type === "request") {
        console.log(dane.message);
        setFriendAccept(dane.odKogo);
        setTimeout(() => setFriendAccept(null), 10000);
      }
    });

    socketRef.current.on("roomMessages", (dane) => {
      if (dane.success === true) {
        setRoomMessages(dane.messages);
        setCurrentRoom(dane.room);
        currentRoomRef.current = dane.room;
      }
    });

    socketRef.current.on("newMessage", (dane) => {
      if (dane.room !== currentRoomRef.current) return;
      setRoomMessages((prev) => {
        const msg: IMessage = {
          message: dane.message,
          sender_name: dane.sender_name,
          time_mess: dane.time_mess,
        };
        if (prev === null) return [msg];
        return [...prev, msg];
      });
    });

    socketRef.current.on("casinoUpdateMultiplier", (dane) => {
      setMultiplier(dane.currentMultiplier);
      setIsWinCasino(dane.message);
      setTimeout(() => setIsWinCasino(null), 1500);
    });

    socketRef.current.on("disconnectPlayer", (dane) => {
      otherPlayers.current.delete(dane.id);
      setPlayerIds((prev) => prev.filter((id) => id !== dane.id));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const loginOutput = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput_login_login, chatInput_login_password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        setToken(data.token);
      } else {
        setAlertLogin(true);
        seterrMessageLogin(data.message);
        console.log("Błąd logowania");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const registerOutput = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput_register_login, chatInput_register_password }),
      });
      const data = await response.json();
      if (response.ok) {
        setLogin(true);
        setRegister(false);
      } else {
        setAlertRegister(true);
        seterrMessageRegister(data.message);
        console.log("Błąd rejestracji");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getItemImage = (nazwa: string) => {
    if (nazwa === "Długi Miecz") return dlugi_miecz_fixed;
    if (nazwa === "Miecz Dusz") return miecz_dusz_fixed;
    if (nazwa === "Monolit Slayer") return monolit_slayer_fixed;
    return null;
  };

  const handleBuyItem = async (item: IShop) => {
    if (!token) return;
    const dane = await buyItem(item, token);
    setGold(dane.gold);
    setInventory(dane.inventory);
    setInventory((prev) => {
      return prev
        .map((i) => {
          if (i.czyzalozony === true) {
            return { ...i, ilosc: i.ilosc - 1 };
          } else return i;
        })
        .filter((i) => i.ilosc > 0);
    });
  };

  const handlePutOnItem = async (item: IItem) => {
    if (putOnItem) return;
    if (!token) return;

    const data = await fetchPutOnItem(item, token);
    console.log(data.message);

    setInventory(data.inventory); // Tutaj synchronizacja z serwerem
    setInventory((prev) => {
      return prev
        .map((i) => {
          if (i.czyzalozony === true) {
            return { ...i, ilosc: i.ilosc - 1 };
          } else return i;
        })
        .filter((i) => i.ilosc > 0);
    });

    if (upgradeItemHover) {
      const u = upgradeItemHover[0];
      setInventory((prev) => prev.map((i) => (i.id === u.id && i.poziom === u.poziom ? { ...i, ilosc: i.ilosc - 1 } : i)).filter((i) => i.ilosc > 0));
    }

    setPutOnItem([item]);
  };

  const handleTakeoffItem = async () => {
    if (!putOnItem) return;
    if (!token) return;
    const item = putOnItem[0];

    const data = await fetchTakeOffItem(item, token);
    console.log(data.message);

    setInventory((prev) => {
      const isItem = prev.some((i) => i.id === item.id && i.poziom === item.poziom);
      if (isItem) {
        return prev.map((i) => {
          if (i.id === item.id && i.poziom === item.poziom) {
            return { ...i, ilosc: i.ilosc + 1 };
          } else return i;
        });
      } else {
        return [...prev, { ...item, ilosc: 1 }];
      }
    });
    setPutOnItem(null);
  };

  const handleUpgrade = async () => {
    if (!token) return;
    if (!upgradeItemHover) return;
    const item = upgradeItemHover[0];

    const data = await fetchUpgradeItem(item, token);
    if (data.message === "Ulepszenie_powiodło_się") {
      console.log("Ulepszenie powiodło się");
      setIsWinUpgrade("Ulepszenie powiodło się!");
      setTimeout(() => setIsWinUpgrade(null), 1500);
    } else if (data.message === "Spalilo") {
      console.log("Spaliło");
      setIsWinUpgrade("Spaliło!");
      setTimeout(() => setIsWinUpgrade(null), 1500);
    }

    setInventory(data.inventory);
    setInventory(data.inventory.map((i: IItem) => (i.czyzalozony ? { ...i, ilosc: i.ilosc - 1 } : i)).filter((i: IItem) => i.ilosc > 0));

    setGold(data.gold);
    setUpgradeItemHover(null);
  };

  const handlePutOnUpgrade = (item: IItem) => {
    if (upgradeItemHover) return;
    setInventory((prev) => {
      if (item.ilosc > 1) {
        return prev.map((i) => {
          if (i.id === item.id && i.poziom === item.poziom) return { ...i, ilosc: i.ilosc - 1 };
          return i;
        });
      } else return prev.filter((i) => !(i.id === item.id && i.poziom === item.poziom));
    });
    setUpgradeItemHover([item]);
  };

  const handleTakeoffUpgrade = () => {
    if (!upgradeItemHover) return;
    const item = upgradeItemHover[0];
    setInventory((prev) => {
      const isItem = prev.some((i) => i.id === item.id && i.poziom === item.poziom);
      if (isItem) {
        return prev.map((i) => {
          if (i.id === item.id && i.poziom === item.poziom) {
            return { ...i, ilosc: i.ilosc + 1 };
          } else return i;
        });
      } else {
        return [...prev, item];
      }
    });
    setUpgradeItemHover(null);
  };

  const handleOpenChat = (friend: string) => {
    setMessageTargetName(friend);
    socketRef.current?.emit("StartChat", { name: friend });
  };

  const eqWeapon = putOnItem ? putOnItem[0].nazwa : null;

  if (frontPage) {
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
          <div className="absolute inset-0 bg-linear-to-b from-black from-0% via-black/20 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-linear-to-t from-black from-0% via-black/20 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-linear-to-l from-black from-0% via-black/20 via-30% to-transparent to-50%" />
          <div className="absolute inset-0 bg-linear-to-r from-black from-0% via-black/20 via-30% to-transparent to-50%" />

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
            onClick={() => setfrontPage(false)}
          >
            ▷ Zagraj już teraz
          </button>
        </section>

        <section id="gra" className="flex min-h-screen items-center justify-center bg-black px-6 py-24 text-white">
          <div className="group relative w-5xl rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-linear-to-b from-purple-900/0 to-purple-700/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 mb-6">
              <p className="text-sm font-medium tracking-[0.2em] text-purple-300 uppercase">O grze</p>
              <h2 className="mt-3 text-4xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                Monolit
              </h2>
              <p className="mt-4 text-justify text-sm leading-relaxed text-white/70"> Monolit to przeglądarkowe MMO osadzone w świetlistym, mrocznym świecie. Eksploruj biolumescencyjną kraine, rozbijaj monolity i rośnij w siłe - w walce w czasie rzeczywistym, ramię w ramię z innymi graczami. Bez instalacji: wystarczy otworzyć kartę przeglądarki.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["MMO w przeglądarce", "Walka w czasie rzeczywistym", "Multiplayer"].map((tag) => (
                  <span key={tag} className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative z-10 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_80px_-20px_rgba(168,100,255,0.6)]">
              <img src={gameplayimg_1} alt="Rozgrywka w Monolit" className="w-full transition-transform duration-300 group-hover:-translate-y-1" />
            </div>
          </div>
        </section>

        <section id="technologia" className="flex min-h-screen items-center justify-center bg-black px-6 py-24 text-white">
          <div className="group relative flex w-5xl flex-row gap-10 rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="w-2/3">
              <div className="grid grid-cols-3 gap-4">
                {stack.map(({ name, Icon, color }) => (
                  <div key={name} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/3 p-4 text-center transition hover:border-purple-400/40 hover:bg-purple-500/10">
                    <Icon className="h-8 w-8" style={{ color }} />
                    <span className="text-xs text-white/70">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/3">
              <p className="text-sm font-medium tracking-[0.2em] text-purple-300 uppercase">TECHNOLOGIA</p>
              <h2 className="mt-3 text-2xl font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                Zbudowane od zera
              </h2>
              <div className="mt-4 space-y-6 text-white/70">
                <div className="flex gap-3">
                  <span className="mt-1 text-purple-400">▸</span>
                  <p className="text-justify leading-relaxed">Przeglądarkowe MMO budowane w całości solo - frontend 3D, fizyka, serwer, multiplayer i baza danych.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 text-purple-400">▸</span>
                  <p className="text-justify leading-relaxed">Gracze widzą się w czasie rzeczywistym i dzielą jeden świat, którym zarządza autorytatywny serwer.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 text-purple-400">▸</span>
                  <p className="text-justify leading-relaxed">Całość w TypeScript, renderowana w przeglądarce i wdrożona online - bez instalacji po stronie gracza.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="o-tworcy" className="flex min-h-screen items-center justify-center bg-black px-6 py-24 text-white">
          <div className="group relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12">
            <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-linear-to-br from-white/0 via-white/5 to-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-row items-center gap-8">
              <div className="w-56 shrink-0 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="overflow-hidden rounded-xl border border-white/10 shadow-[0_0_80px_-20px_rgba(255,255,255,0.35)]">
                  <img src={Profil} alt="Rafał Trzeciakowski" className="aspect-4/5 w-full" />
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium tracking-[0.2em] text-purple-300 uppercase">O twórcy</p>
                <h2 className="mt-2 font-[Cinzel] text-4xl text-white">Rafał Trzeciakowski</h2>
                <p className="mt-1 text-white/50">Full-stack developer & inżynier elektronik</p>

                <div className="mt-5 space-y-4 text-justify leading-relaxed text-white/70">
                  <p>Inżynier (Elektronika i Telekomunikacja) i magister (Systemy Elektroniczne w Mechatronice) Politechniki Wrocławskiej. Dziś przekuwam ten techniczny fundament - myślenie systemowe, rozkładanie problemów na części i dbałość o szczegóły w tworzenie aplikacji webowych.</p>
                  <p>Monolit to dla mnie sprawdzian tej drogi w praktyce: od fizyki i renderowania 3D w przeglądarce, przez logikę rozgrywki, po serwer i bazę danych. Lubię budować rzeczy, które realnie działają i uczyć się, rozumiejąc, jak działają pod spodem.</p>
                </div>
              </div>

              <div className="mt-6 flex gap-5">
                <a href="https://github.com/RafalUxi" target="_blank" rel="noopener noreferrer" className="text-white/40 transition-colors duration-200 hover:text-purple-300">
                  <FiGithub className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com/in/Rafał-Trzeciakowski" target="_blank" rel="noopener noreferrer" className="text-white/40 transition-colors duration-200 hover:text-purple-300">
                  <FiLinkedin className="h-5 w-5" />
                </a>
                <a href="mailto:rafal.trzeciakowski9090@o2.pl" className="text-white/40 transition-colors duration-200 hover:text-purple-300">
                  <FiMail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!frontPage && !token) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <div className="absolute top-0 -right-5 z-10 h-screen w-1/3 rounded-4xl bg-linear-to-b from-pink-950 to-purple-950">
          {login_menu === true && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              <h1 className="text-3xl">logowanie użytkownika</h1>
              <div className="flex flex-row border-b">
                <FiUser className="h-6 w-6" />
                <input className="px-2 py-1 outline-none" type="text" placeholder="login" value={chatInput_login_login.slice(0, 16)} onChange={(e) => setChatInput_login_login(e.target.value)} />
              </div>
              <div className="flex flex-row border-b">
                <FiLock className="h-5 w-5" />
                <input className="px-2 py-1 outline-none" type="text" placeholder="hasło" value={chatInput_login_password.slice(0, 16)} onChange={(e) => setChatInput_login_password(e.target.value)} />
              </div>
              {alertLogin === true && <div className="font-bold">{errMessageLogin}</div>}
              <button className="text-2xl hover:text-purple-200" onClick={loginOutput}>
                Zaloguj
              </button>
              <div className="text-1xl">
                Nie masz konta?
                <button
                  className="text-purple-300 hover:text-purple-400"
                  onClick={() => {
                    setLogin(false);
                    setRegister(true);
                  }}
                >
                  Zarejestruj się!
                </button>
              </div>
            </div>
          )}
          {register_menu === true && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              <h1 className="text-3xl">rejestracja użytkownika</h1>
              <div className="flex flex-row border-b">
                <FiUser className="h-6 w-6" />
                <input className="px-2 py-1 outline-none" type="text" placeholder="login" value={chatInput_register_login.slice(0, 16)} onChange={(e) => setChatInput_register_login(e.target.value)} />
              </div>
              <div className="flex flex-row border-b">
                <FiLock className="h-5 w-5" />
                <input className="px-2 py-1 outline-none" type="text" placeholder="hasło" value={chatInput_register_password.slice(0, 16)} onChange={(e) => setChatInput_register_password(e.target.value)} />
              </div>
              {alertRegister === true && <div className="font-bold">{errMessageRegister}</div>}
              <button className="text-2xl hover:text-purple-200" onClick={registerOutput}>
                Zarejestruj
              </button>
              <div className="text-1xl">
                <button
                  className="text-purple-300 hover:text-purple-400"
                  onClick={() => {
                    setLogin(true);
                    setRegister(false);
                  }}
                >
                  Powrót do logowania
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-0">
          <Canvas camera={{ position: [10, 5, 10] }}>
            <ambientLight intensity={3} color="#2a1040" />
            <directionalLight position={[2.3, 4, 3]} intensity={10} color="#ffffff" />
            <pointLight position={[5, 2, 7]} color="#ff00aa" intensity={60} decay={1} />
            <pointLight position={[5, 3, 7]} color="#9333ea" intensity={30} decay={1} />

            <group position={[5, 1, 7]} scale={2.3} rotation={[0, Math.PI / 3, 0]}>
              {login_menu === true && <KnightLoggingAnimation action="dance2" />}
              {register_menu === true && <KnightLoggingAnimation action="dance1" />}
            </group>
            <mesh position={[5, 1, 7]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[8, 64]} />
              <meshStandardMaterial color="#1a0a2e" emissive="#3b0764" emissiveIntensity={0.3} />
            </mesh>
          </Canvas>
        </div>
      </div>
    );
  }
  if (!frontPage && token)
    return (
      <div className="h-screen w-full">
        {news !== null && (
          <div className="pointer-events-none absolute top-1/6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-black/70 px-6 py-3 whitespace-nowrap backdrop-blur-sm">
            <span style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px #facc15" }} className="text-3xl font-black tracking-widest text-yellow-400">
              {news}
            </span>
          </div>
        )}

        {friendAccept !== null && (
          <div className="pointer-events-auto absolute top-1/3 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center space-y-4 rounded-md bg-black/70 px-6 py-3 whitespace-nowrap">
            <h1 className="pointer-events-none text-3xl font-black tracking-widest text-white">Czy chcesz dodać gracza {friendAccept} do listy znajomych</h1>
            <div className="flex-rows flex gap-10">
              <button
                onClick={() => {
                  socketRef.current?.emit("AddFriendsResponseYes", { nameSender: friendAccept });
                  setFriendAccept(null);
                }}
                className="rounded-2xl border-2 border-violet-950 px-4 py-1 text-3xl font-bold text-yellow-200 hover:text-amber-300"
              >
                TAK
              </button>
              <button
                onClick={() => {
                  socketRef.current?.emit("AddFriendsResponseNo", { nameSender: friendAccept });
                  setFriendAccept(null);
                }}
                className="rounded-2xl border-2 border-violet-950 px-4 py-1 text-3xl font-bold text-yellow-200 hover:text-amber-300"
              >
                NIE
              </button>
            </div>
          </div>
        )}

        <img src={GoldUI} alt="Gold" className="absolute right-0 bottom-0 z-10 h-50 w-80" />
        <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute right-0 bottom-0 z-10 mr-40 mb-19.5 text-4xl text-yellow-600">
          {gold}
        </span>
        <div className="absolute z-10 flex h-screen w-25 flex-col justify-end bg-transparent">
          <div className="overflow-hidden rounded-4xl border-4 border-violet-950">
            <div className="group/eq">
              <img src={EqUI} alt="UI_EQ" className="h-25 w-25" onClick={() => setIsOpenEq(true)} />
              <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute bottom-0 left-0 mb-85 ml-25 rounded-2xl border-2 border-violet-950 bg-black px-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover/eq:opacity-100">
                Ekwipunek
              </span>
            </div>
            <div className="group/eq">
              <img src={ShopUI} alt="UI_EQ" className="h-25 w-25" onClick={() => setIsOpenShop(true)} />
              <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute bottom-0 left-0 mb-60 ml-25 rounded-2xl border-2 border-violet-950 bg-black px-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover/eq:opacity-100">
                Sklep
              </span>
            </div>
            <div className="group/czat">
              <img src={CzatUI} alt="UI_Czat" className="h-25 w-25" onClick={() => setIsOpenChat(true)} />
              <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute bottom-0 left-0 mb-35 ml-25 rounded-2xl border-2 border-violet-950 bg-black px-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover/czat:opacity-100">
                Znajomi/Czat
              </span>
            </div>
            <div className="group/kasyno">
              <img src={CasinoUI} alt="UI_Kasyno" onClick={() => setIsOpenCasino(true)} className="h-25 w-25" />
              <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute bottom-0 left-0 mb-10 ml-25 rounded-2xl border-2 border-violet-950 bg-black px-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity group-hover/kasyno:opacity-100">
                Kasyno
              </span>
            </div>
          </div>
        </div>
        {isOpenEq && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            <div style={{ backgroundImage: `url(${EqImg})`, backgroundSize: "cover", backgroundPosition: "center" }} className="pointer-events-none relative h-200 w-7xl overflow-hidden rounded-2xl">
              <div className="pointer-events-auto absolute top-0 right-0 mt-27.5 mr-65.5 h-7 w-26 cursor-pointer rounded-sm" onClick={() => setIsOpenEq(false)}></div>
              <div className="pointer-events-auto absolute bottom-0 left-15.5 mb-25 h-14 w-48.5 cursor-pointer rounded-sm border-amber-400" onClick={() => handleUpgrade()}></div>
              <div className="absolute top-0 left-0 mt-62.5 ml-95 h-92 w-68">
                <div className="grid grid-cols-3 gap-3 -space-y-1.5">
                  {inventory.map((item) => {
                    const img = getItemImage(item.nazwa);
                    if (!img) return null;
                    return (
                      <div key={`${item.id}_${item.poziom}`} className="group/menu pointer-events-auto relative" onMouseEnter={() => setHoveredItem(item)} onMouseLeave={() => setHoveredItem(null)}>
                        <div key={item.id} className="h-22 w-7">
                          <div style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", transform: `rotate(45deg)` }} className="h-full w-full" />
                        </div>
                        <div className="absolute top-0 right-0 mr-5 rounded-xl bg-black px-1 text-center text-sm text-yellow-500">x{item.ilosc}</div>
                        <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute top-0 left-0 z-40 mt-18 -ml-14 flex flex-col space-y-2 rounded-2xl border-2 border-violet-950 bg-black px-2 py-2 text-sm whitespace-nowrap text-white opacity-0 group-hover/menu:opacity-100">
                          <button onClick={() => handlePutOnItem(item)} className="hover:text-violet-500">
                            Załóż przedmiot
                          </button>
                          <button onClick={() => handlePutOnUpgrade(item)} className="hover:text-violet-500">
                            Ulepsz przedmiot
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {upgradeItemHover !== null && (
                <div className="pointer-events-none h-screen w-full">
                  <div className="pointer-events-none absolute top-0 left-0 z-40 mt-109.5 ml-11 h-60 w-60 overflow-visible">
                    {upgradeItemHover.map((item) => {
                      const img = getItemImage(item.nazwa);
                      if (!img) return null;
                      return (
                        <div
                          key={item.id}
                          style={{
                            backgroundImage: `url(${img})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            transform: `rotate(45deg) scale(0.42)`,
                          }}
                          className="h-full w-full"
                        />
                      );
                    })}
                  </div>
                  <div className="group/menu pointer-events-auto absolute top-0 left-0 z-50 mt-129 ml-31 h-20 w-20">
                    <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute top-0 left-0 z-40 mt-20 ml-0 flex flex-col rounded-2xl border-2 border-violet-950 bg-black px-2 py-2 text-sm whitespace-nowrap text-white opacity-0 group-hover/menu:opacity-100">
                      <button onClick={() => handleTakeoffUpgrade()} className="hover:text-violet-500">
                        Powrót
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {putOnItem !== null && (
                <div className="pointer-events-none h-screen w-full">
                  <div className="pointer-events-auto absolute top-0 left-0 z-50 mt-35.5 ml-10 h-60 w-60 overflow-visible">
                    {putOnItem.map((item) => {
                      const img = getItemImage(item.nazwa);
                      if (!img) return null;
                      return (
                        <div
                          onMouseEnter={() => setHoveredItem(item)}
                          onMouseLeave={() => setHoveredItem(null)}
                          key={item.id}
                          style={{
                            backgroundImage: `url(${img})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            transform: `rotate(45deg) scale(0.7)`,
                          }}
                          className="pointer-events-auto h-full w-full"
                        />
                      );
                    })}
                  </div>
                  <div className="group/menu pointer-events-auto absolute top-0 left-0 z-50 mt-46 ml-21 h-38 w-38">
                    <span style={{ fontFamily: "'Cinzel', serif" }} className="absolute top-0 left-0 z-40 mt-35 ml-0 flex flex-col rounded-2xl border-2 border-violet-950 bg-black px-2 py-2 text-sm whitespace-nowrap text-white opacity-0 group-hover/menu:opacity-100">
                      <button onClick={() => handleTakeoffItem()} className="hover:text-violet-500">
                        Zdejmij przedmiot
                      </button>
                    </span>
                  </div>
                </div>
              )}
              {isWinUpgrade !== null && (
                <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 rounded-xl bg-black/70 px-6 py-3 whitespace-nowrap backdrop-blur-sm">
                  <span style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px #facc15" }} className="text-3xl font-black tracking-widest text-yellow-400">
                    {isWinUpgrade}
                  </span>
                </div>
              )}
              {hoveredItem && (
                <div style={{ fontFamily: "'Cinzel', serif" }} className="pointer-events-none absolute top-0 right-0 mt-65 mr-78 flex h-85 w-72 flex-col space-y-2 text-xl text-white">
                  <h1 className="text-center text-2xl text-yellow-500">{hoveredItem.nazwa}</h1>
                  <span>Ilość: {hoveredItem.ilosc}</span>
                  <span>Poziom: {hoveredItem.poziom}</span>
                  <span>Obrażenia: </span>
                  <span>Opis: </span>
                </div>
              )}
              <span style={{ fontFamily: "'Cinzel', serif" }} className="pointer-events-none absolute bottom-0 left-0 z-10 mb-149 ml-184 text-2xl/snug text-yellow-500">
                {gold}
              </span>
            </div>
          </div>
        )}
        {isOpenShop && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            <div style={{ backgroundImage: `url(${ShopImg})`, backgroundSize: "cover", backgroundPosition: "center" }} className="pointer-events-auto relative h-155 w-210 overflow-hidden rounded-2xl">
              <span style={{ fontFamily: "'Cinzel', serif" }} className="pointer-events-none absolute bottom-0 left-0 z-10 mb-109 ml-125.5 text-2xl/snug text-yellow-500">
                {gold}
              </span>
              <div style={{ backgroundImage: `url(${dlugi_miecz})`, backgroundSize: "cover", backgroundPosition: "center", transform: "rotate(-135deg)" }} className="pointer-events-none absolute bottom-0 left-0 mb-56.5 ml-29.5 h-45 w-35"></div>
              <div style={{ backgroundImage: `url(${miecz_dusz})`, backgroundSize: "cover", backgroundPosition: "center", transform: "rotate(45deg)" }} className="pointer-events-none absolute bottom-0 left-0 mb-53.5 ml-97.5 h-50 w-15"></div>
              <div style={{ backgroundImage: `url(${monolit_slayer})`, backgroundSize: "cover", backgroundPosition: "center", transform: "rotate(45deg)" }} className="pointer-events-none absolute bottom-0 left-0 mb-53 ml-154 h-50 w-15"></div>

              <span style={{ fontFamily: "'Cinzel', serif" }} className="pointer-events-none absolute bottom-0 left-0 z-10 mb-45 ml-141.5 text-xl/snug text-white">
                Monolit Slayer
              </span>
              <span style={{ fontFamily: "'Cinzel', serif" }} className="pointer-events-none absolute bottom-0 left-0 z-10 mb-45 ml-90.5 text-xl/snug text-white">
                Miecz Dusz
              </span>
              <span style={{ fontFamily: "'Cinzel', serif" }} className="pointer-events-none absolute bottom-0 left-0 z-10 mb-45 ml-31.5 text-xl/snug text-white">
                Długi Miecz
              </span>
              <span style={{ fontFamily: "'Cinzel', serif" }} onClick={() => handleBuyItem(shopList[0])} className="absolute bottom-0 left-0 z-10 mb-23 ml-29.5 cursor-pointer text-xl/snug text-yellow-500">
                Cena: 10 złota
              </span>
              <span style={{ fontFamily: "'Cinzel', serif" }} onClick={() => handleBuyItem(shopList[1])} className="absolute bottom-0 left-0 z-10 mb-23 ml-86 cursor-pointer text-xl/snug text-yellow-500">
                Cena: 50 złota
              </span>
              <span style={{ fontFamily: "'Cinzel', serif" }} onClick={() => handleBuyItem(shopList[2])} className="absolute bottom-0 left-0 z-10 mb-23 ml-142 cursor-pointer text-xl/snug text-yellow-500">
                Cena: 100 złota
              </span>
              <div className="absolute top-0 right-0 mt-20.5 mr-7.5 h-9 w-30 cursor-pointer rounded-sm" onClick={() => setIsOpenShop(false)}></div>
            </div>
          </div>
        )}

        {isOpenChat && (
          <div className="pointer-events-none absolute inset-0 z-40 h-screen w-full">
            {addFriendsError !== null && (
              <div className="pointer-events-none absolute top-0 left-1/2 z-60 mt-15 -translate-x-1/2 rounded-xl bg-black/70 px-6 py-3 whitespace-nowrap backdrop-blur-sm">
                <span style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px #facc15" }} className="text-3xl font-black tracking-widest text-yellow-400">
                  {addFriendsError}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 z-50 flex h-screen w-1/2 items-center justify-center">
              <div className="pointer-events-auto relative h-128 w-64 rounded-4xl border-4 border-violet-800 bg-black">
                <h1 style={{ fontFamily: "'Cinzel', serif" }} className="mt-3.5 flex justify-center text-2xl font-bold text-white">
                  Znajomi
                </h1>
                <div className="absolute top-0 right-0">
                  <button style={{ backgroundImage: `url(${CasinoExit})`, backgroundSize: "cover", backgroundPosition: "center" }} className="m-2 h-10 w-10 cursor-pointer hover:bg-blue-200/10" onClick={() => setIsOpenChat(false)}></button>
                </div>
                <div className="absolute bottom-0 left-1/2 mb-4 flex -translate-x-1/2 items-center gap-1">
                  <input
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") socketRef.current?.emit("AddFriends", { name: addFriend });
                    }}
                    onKeyUp={(e) => e.stopPropagation()}
                    className="rounded-md bg-gray-400 pl-2 text-black outline-none"
                    type="text"
                    placeholder="dodaj znajomego"
                    value={addFriend.slice(0, 12)}
                    onChange={(e) => setAddFriend(e.target.value)}
                  />
                  <button onClick={() => socketRef.current?.emit("AddFriends", { name: addFriend })} className="text-violet-400 hover:text-violet-200">
                    <FiSend className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute top-0 left-0 mt-18 flex h-3/4 w-full flex-col items-center space-y-2 overflow-y-auto">
                  {friendsList?.map((item, i) => {
                    return (
                      <div key={i} onClick={() => handleOpenChat(item)} className="flex h-8 w-9/10 cursor-pointer gap-2 rounded-3xl border-2 border-violet-500 bg-violet-950 pl-4 font-medium text-white hover:bg-violet-900">
                        <FiUser className="h-6 w-6" />
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {roomMessages !== null && (
              <div className="pointer-events-none relative z-40 flex h-full w-screen items-center justify-end">
                <div
                  style={{
                    backgroundImage: `url(${chat})`,
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    aspectRatio: "160/100",
                  }}
                  className="pointer-events-none relative -mr-30 w-240 max-w-[90vw] overflow-hidden rounded-xl"
                >
                  <div
                    onClick={() => {
                      setRoomMessages(null);
                      currentRoomRef.current = null;
                      setRoomMessages(null);
                    }}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setRoomMessages(null);
                        setCurrentRoom(null);
                        currentRoomRef.current = null;
                      }
                    }}
                    className="pointer-events-auto absolute cursor-pointer rounded-xl"
                    style={{
                      top: "13.2%",
                      right: "28.3%",
                      width: "3.5%",
                      aspectRatio: "1",
                    }}
                  />
                  <div
                    onClick={() => {
                      socketRef.current?.emit("SendMessage", { message: message, room: currentRoom, targetName: messageTargetName });
                      setMessage("");
                    }}
                    role="button"
                    className="pointer-events-auto absolute cursor-pointer rounded-xl"
                    style={{
                      top: "77%",
                      right: "30.3%",
                      width: "3.5%",
                      aspectRatio: "1",
                    }}
                  />
                  <input
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        socketRef.current?.emit("SendMessage", { message: message, room: currentRoom, targetName: messageTargetName });
                        setMessage("");
                      }
                    }}
                    onKeyUp={(e) => e.stopPropagation()}
                    style={{
                      top: "77%",
                      right: "34.3%",
                      width: "35%",
                      height: "5%",
                    }}
                    className="pointer-events-auto absolute rounded-md bg-transparent pl-2 text-white outline-none"
                    type="text"
                    placeholder="Napisz wiadomość"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />

                  <div className="pointer-events-auto absolute flex flex-col-reverse space-y-1 overflow-y-auto px-4" style={{ top: "26%", right: "30%", width: "41%", height: "48%" }}>
                    {[...roomMessages].reverse().map((item, i) => (
                      <div key={i} className={`flex flex-col ${item.sender_name === playerUserName ? "items-end" : "items-start"}`}>
                        <div className="rounded-2xl border-2 border-b-violet-600 bg-black px-4">
                          <div className={`flex ${item.sender_name === playerUserName ? "justify-end" : "justify-start"} gap-2`}>
                            <span className="text-xs font-bold text-violet-300">{item.sender_name}</span>
                            <span className="text-xs text-gray-400">{new Date(item.time_mess).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <span className={`flex ${item.sender_name === playerUserName ? "justify-end" : "justify-start"} text-md text-white`}>{item.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isOpenCasino && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            <div style={{ backgroundImage: `url(${CasinoImg})`, backgroundSize: "cover", backgroundPosition: "center" }} className="pointer-events-auto relative h-155 w-210 overflow-hidden rounded-2xl">
              <div className="flex justify-end">
                <button style={{ backgroundImage: `url(${CasinoExit})`, backgroundSize: "cover", backgroundPosition: "center" }} className="m-2 h-10 w-10 cursor-pointer hover:bg-blue-200/10" onClick={() => setIsOpenCasino(false)}></button>
              </div>
              <div className="absolute bottom-0 left-0 mb-4.5 ml-75">
                <input
                  className="h-6 w-24 [appearance:textfield] bg-transparent text-3xl font-medium text-yellow-600 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  type="number"
                  value={goldInput === 0 ? "" : goldInput}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setGoldInput(newValue);
                    if (newValue > gold || newValue <= 0) setCasinoErr(true);
                    else setCasinoErr(false);
                  }}
                />
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 mb-4.5 ml-120">
                <span className="text-3xl font-medium text-yellow-600">{Math.floor(multiplier * 100) / 100}</span>
              </div>
              {isWinCasino !== null && (
                <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 rounded-xl bg-black/70 px-6 py-3 whitespace-nowrap backdrop-blur-sm">
                  <span style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 20px #facc15" }} className="text-3xl font-black tracking-widest text-yellow-400">
                    {isWinCasino}
                  </span>
                </div>
              )}
              {casinoErr === true && (
                <div className="pointer-events-none absolute bottom-0 left-0 mb-5.5 ml-63">
                  <span className="text-xl font-medium text-yellow-500">❌</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 mb-58 ml-91 rounded-2xl">
                {isLosuj === true && (
                  <button
                    className="text-5xl font-medium text-yellow-600 hover:text-yellow-500"
                    onClick={() => {
                      socketRef.current?.emit("casinoStart", { event: "Start", goldInput: goldInput });
                      setIsLosuj(false);
                    }}
                  >
                    Start
                  </button>
                )}
                {isLosuj === false && (
                  <button
                    className="text-5xl font-medium text-yellow-600 hover:text-yellow-500"
                    onClick={() => {
                      socketRef.current?.emit("casinoStop", { event: "Stop" });
                      setIsLosuj(true);
                    }}
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <Canvas camera={{ position: [0, 5, 8] }}>
          <ambientLight intensity={10} color="#4a2480" />
          <color attach="background" args={["#000000"]} />

          <pointLight position={[7, 4, 14]} color="#ff00aa" intensity={50} distance={10} decay={2} />
          <pointLight position={[12, 3, 5]} color="#ff00aa" intensity={30} distance={8} decay={2} />

          {/* Modele mapy + kontroler postaci */}
          <Physics timeStep="vary">
            <PlayerController weapon={eqWeapon} posicionChange={(newPos) => socketRef.current?.emit("sendMessage", { type: "move", ...newPos })} />
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