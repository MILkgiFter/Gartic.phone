'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io } from 'socket.io-client';

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [language, setLanguage] = useState("English");
  const router = useRouter();

  // Load profile from localStorage
  useEffect(() => {
    let savedUserId = localStorage.getItem('gartic_userId');
    if (!savedUserId) {
      savedUserId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('gartic_userId', savedUserId);
    }

    const savedNickname = localStorage.getItem('gartic_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
    const savedLanguage = localStorage.getItem('gartic_language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handlePlay = () => {
    // Save profile to localStorage
    if (nickname) {
      localStorage.setItem('gartic_nickname', nickname);
    }
    localStorage.setItem('gartic_language', language);

    // Quick Play Logic
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket = io(socketUrl);
    socket.on('connect', () => {
      socket.emit('get_rooms');
    });

    socket.on('rooms_list', (activeRooms: any[]) => {
      const availableRoom = activeRooms.find(room => 
        room.players.length < 10 && 
        room.language === language
      );

      if (availableRoom) {
        router.push(`/game/${availableRoom.id}?nickname=${nickname || 'User' + Math.floor(Math.random() * 9999)}&language=${language}`);
      } else {
        const newRoomId = Math.random().toString(36).substring(7);
        router.push(`/game/${newRoomId}?nickname=${nickname || 'User' + Math.floor(Math.random() * 9999)}&language=${language}`);
      }
      socket.disconnect();
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground">
      {/* Header with logo */}
      <header className="mt-12 mb-8">
        <div className="flex flex-col items-center gap-2">
          <div className="text-primary text-6xl font-black italic tracking-tighter">
            Gartic<span className="text-foreground">.phone</span>
          </div>
          <p className="text-sm font-medium opacity-70">Draw, Guess, WIN</p>
        </div>
      </header>

      <main className="w-full max-w-lg px-4">
        <div className="sketchy-container">
          {/* Main Play Area */}
          <div className="p-2 flex flex-col gap-6">
            <h2 className="text-3xl font-black text-center">QUICK PLAY</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold uppercase opacity-60 px-1">Nickname:</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="User5320" 
                  className="sketchy-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold uppercase opacity-60 px-1">Language:</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="sketchy-input appearance-none cursor-pointer"
                >
                  <option>English</option>
                  <option>Русский</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={handlePlay}
                className="sketchy-btn w-full text-2xl"
              >
                PLAY!
              </button>
              <Link href="/rooms">
                <button className="sketchy-btn secondary w-full text-2xl">
                  ROOMS
                </button>
              </Link>
            </div>
          </div>

          {/* Social Login */}
          {/* <div className="bg-black/5 p-8 flex flex-col gap-6 border-t border-black/5">
            <h3 className="text-sm font-bold text-center opacity-60">CHOOSE A WAY TO LOG IN:</h3>
            <div className="flex justify-center gap-4">
              {['twitter', 'google', 'vk', 'discord'].map((provider) => (
                <button key={provider} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow border border-black/5" title={`Login with ${provider}`}>
                  <div className="w-6 h-6 opacity-60 capitalize text-[10px] font-bold flex items-center justify-center">{provider[0]}</div>
                </button>
              ))}
            </div>
          </div> */}
        </div>

        {/* Get the apps! */}
        {/* <div className="mt-8 flex flex-col items-center gap-4">
          <h5 className="text-xs font-bold uppercase opacity-40">Get the apps!</h5>
          <div className="flex gap-4">
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">
              <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="text-xs">Play Store</div>
              </div>
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">
              <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="text-xs">App Store</div>
              </div>
            </a>
          </div>
        </div> */}
      </main>

      <footer className="mt-12 pb-8 text-xs font-bold opacity-30 flex gap-4">
        {/* <Link href="#">DOWNLOAD</Link> */}
        <Link href="/terms">SERVICE</Link>
        <Link href="/privacy">PRIVACY</Link>
        {/* <Link href="#">CONTACT</Link> */}
      </footer>
    </div>
  );
}
