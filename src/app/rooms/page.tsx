'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { translations } from '@/lib/translations';

interface Room {
  id: string;
  players: number;
  language: string;
  settings?: {
    pointsLimit: number;
    drawTime: number;
  };
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [nickname, setNickname] = useState('');
  const [language, setLanguage] = useState('English');
  const [pointsLimit, setPointsLimit] = useState(500);
  const [drawTime, setDrawTime] = useState(60);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const t = translations[language as keyof typeof translations] || translations.English;

  useEffect(() => {
    // Load profile from localStorage
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

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('get_rooms');
    });

    socket.on('rooms_list', (activeRooms: any[]) => {
      setRooms(activeRooms.map(room => ({
        id: room.id,
        players: room.players,
        language: room.language,
        settings: room.settings
      })));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (nickname) {
      localStorage.setItem('gartic_nickname', nickname);
    }
    localStorage.setItem('gartic_language', language);

    const createAction = () => {
      const newRoomId = Math.random().toString(36).substring(7);
      router.push(`/game/${newRoomId}?nickname=${nickname || 'User' + Math.floor(Math.random() * 9999)}&language=${language}&pointsLimit=${pointsLimit}&drawTime=${drawTime}`);
    };
    createAction();
  };

  const handleJoinRoom = (roomId: string) => {
    if (nickname) {
      localStorage.setItem('gartic_nickname', nickname);
    }
    localStorage.setItem('gartic_language', language);

    router.push(`/game/${roomId}?nickname=${nickname || 'User' + Math.floor(Math.random() * 9999)}&language=${language}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-card-bg rounded-2xl shadow-xl p-8 border border-black/5">
        <Link href="/" className="text-primary font-bold hover:underline mb-8 inline-block">
          ← {t.backToHome}
        </Link>
        
        <h1 className="text-4xl font-black italic tracking-tighter text-primary mb-8">
          {t.lobbyTitle}
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* User Settings */}
          <div className="md:w-1/3 bg-background p-6 rounded-xl border border-black/5 flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">{t.yourSettings}</h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase opacity-50 px-1">{t.nickname}:</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="User5320" 
                className="w-full bg-card-bg border-2 border-black/5 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase opacity-50 px-1">{t.language}:</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-card-bg border-2 border-black/5 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Русский">Русский</option>
              </select>
            </div>
            
            <hr className="opacity-10 my-2" />
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase opacity-50 px-1">{t.pointsLimit}:</label>
              <input 
                type="number" 
                value={pointsLimit}
                onChange={(e) => setPointsLimit(parseInt(e.target.value))}
                className="w-full bg-card-bg border-2 border-black/5 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-primary transition-colors"
                min="100"
                step="100"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase opacity-50 px-1">{t.drawTime}:</label>
              <select 
                value={drawTime}
                onChange={(e) => setDrawTime(parseInt(e.target.value))}
                className="w-full bg-card-bg border-2 border-black/5 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
                <option value="80">80</option>
                <option value="100">100</option>
                <option value="120">120</option>
              </select>
            </div>

            <button 
              onClick={handleCreateRoom}
              className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-xl text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 uppercase mt-4"
            >
              {t.createRoom}
            </button>
          </div>

          {/* Active Rooms List */}
          <div className="md:w-2/3 bg-background p-6 rounded-xl border border-black/5 flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">{t.activeRooms}</h2>
            {rooms.length === 0 ? (
              <p className="text-center opacity-70">{t.noActiveRooms}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-card-bg p-4 rounded-lg border border-black/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{room.id}</span>
                      <span className="text-sm opacity-70">{room.players}/10 {t.playersShort}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-50">
                      <span>{t.language}: {room.language}</span>
                      {room.settings && (
                        <span>{room.settings.pointsLimit} pts / {room.settings.drawTime}s</span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2 rounded-lg text-sm transition-colors uppercase mt-2"
                    >
                      {t.joinRoom}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}