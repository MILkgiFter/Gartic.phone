'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, use, useEffect, useRef } from 'react';
import DrawingBoard from '@/components/DrawingBoard';
import { io, Socket } from 'socket.io-client';
import { translations } from '@/lib/translations';

interface Player {
  id: string;
  nickname: string;
  points: number;
  disconnected?: boolean;
}

type GameState = 'waiting' | 'selecting_word' | 'drawing';

export default function GameRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const nickname = searchParams.get('nickname') || 'Guest';
  const language = (searchParams.get('language') || 'English') as keyof typeof translations;
  const pointsLimit = searchParams.get('pointsLimit') ? parseInt(searchParams.get('pointsLimit')!) : null;
  const drawTime = searchParams.get('drawTime') ? parseInt(searchParams.get('drawTime')!) : null;
  
  const t = translations[language] || translations.English;

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [messages, setMessages] = useState<{user: string, text: string, isCorrect?: boolean}[]>([
    { user: 'System', text: t.connecting },
  ]);
  const [guess, setGuess] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [currentDrawerId, setCurrentDrawerId] = useState<string>('');
  const [timer, setTimer] = useState<number>(0);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [winner, setWinner] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isPlayersVisible, setIsPlayersVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('gartic_userId');
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL!;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      const settings = pointsLimit && drawTime ? { pointsLimit, drawTime } : null;
      socket.emit('join_room', { roomId, nickname, language, userId, settings });
    });

    socket.on('message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('update_players', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('round_start', (data: any) => {
      setGameState(data.gameState);
      setCurrentDrawerId(data.drawerId);
      setWordOptions([]);
    });

    socket.on('word_options', (options: string[]) => {
      setWordOptions(options);
    });

    socket.on('game_state_update', (data: any) => {
      setGameState(data.gameState);
    });

    socket.on('timer_update', (timeLeft: number) => {
      setTimer(timeLeft);
    });

    socket.on('game_over', (data: { winner: string }) => {
      setWinner(data.winner);
      setGameState('waiting');
      // Clear winner after 5 seconds
      setTimeout(() => setWinner(null), 5000);
    });

    socket.on('canvas_state_receive', (history) => {
      setDrawingHistory(history);
    });

    socket.on('draw_receive', (data) => {
      setDrawingHistory(prev => [...prev, data]);
    });

    socket.on('clear_canvas_receive', () => {
      setDrawingHistory([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, nickname, language]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !socketRef.current) return;
    
    socketRef.current.emit('send_message', {
      roomId,
      message: { user: nickname, text: guess }
    });
    setGuess('');
  };

  const handleSelectWord = (word: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('select_word', { roomId, word });
    setWordOptions([]);
  };

  const handleStartGame = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_game', roomId);
  };

  const handleExit = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    router.push('/');
  };

  const isDrawer = socketRef.current?.id === currentDrawerId;

  const colors = [
    '#000000', '#ffffff', '#7f7f7f', '#c3c3c3', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', 
    '#3f48cc', '#a349a4', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
    '#582d00', '#ff00ff', '#00ffff', '#808000', '#008080', '#000080', '#ff6347', '#ff8c00', '#ffd700', '#32cd32'
  ];

  return (
    <div className="h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* Overlays - Placed at the top level to ensure they are on top of everything */}
      {winner && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-card-bg p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border-4 border-primary animate-bounce">
            <h2 className="text-5xl font-black italic text-primary">{t.gameOver}</h2>
            <div className="flex flex-col items-center">
              <span className="text-xl opacity-70 uppercase font-bold">{t.winnerIs}</span>
              <span className="text-4xl font-black">{winner}</span>
            </div>
          </div>
        </div>
      )}
      {isDrawer && gameState === 'selecting_word' && wordOptions.length > 0 && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-bg p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full border border-white/10">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-black italic tracking-tight text-center uppercase">{t.chooseWord}</h2>
              <span className="text-primary font-bold text-xl">{timer}s</span>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {wordOptions.map((word) => (
                <button
                  key={word}
                  onClick={() => handleSelectWord(word)}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {gameState === 'waiting' && (
        <div className="absolute inset-0 z-40 bg-black/20 flex flex-col items-center justify-center gap-4">
          <div className="bg-white/90 px-6 py-3 rounded-full font-bold shadow-xl uppercase text-center">
            {t.waitingPlayers}
          </div>
          <button 
            onClick={handleStartGame}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-black shadow-2xl transition-all transform hover:scale-105 active:scale-95 uppercase"
          >
            {t.startSolo}
          </button>
        </div>
      )}
      {gameState === 'selecting_word' && !isDrawer && (
        <div className="absolute inset-0 z-40 bg-black/10 flex items-center justify-center">
          <div className="bg-white/90 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-3 uppercase text-center">
            <span>{t.drawerChoosing}</span>
            <span className="text-primary">{timer}s</span>
          </div>
        </div>
      )}

      {/* Left Sidebar (Players) - Hidden on mobile, drawer behavior */}
      <aside className={`absolute lg:relative z-30 w-64 bg-card-bg border-r border-black/5 flex-col h-full transition-transform duration-300 ease-in-out transform ${isPlayersVisible ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex`}>
        <div className="p-4 border-b border-black/5 font-bold flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs opacity-50 uppercase">{t.players}</span>
            <span>{players.length}/10</span>
          </div>
          <button onClick={() => setIsPlayersVisible(false)} className="lg:hidden p-2 rounded-full -mr-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button 
            onClick={handleExit}
            className="hidden lg:block bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all border border-red-500/20"
          >
            {t.exit}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
           {players.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                player.id === socketRef.current?.id ? 'bg-primary/10 border-primary/20' : 'border-transparent'
              } ${player.id === currentDrawerId ? 'ring-2 ring-secondary' : ''} ${player.disconnected ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${player.disconnected ? 'bg-gray-400' : 'bg-primary'}`}>
                  {player.nickname[0].toUpperCase()}
                </div>
                {player.id === currentDrawerId && (
                  <div className="absolute -top-1 -right-1 bg-secondary text-white p-1 rounded-full shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm truncate max-w-[120px]">{player.nickname}</span>
                <span className="text-xs opacity-50">{player.points} {t.points}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 lg:hidden border-t border-black/5">
            <button 
              onClick={handleExit}
              className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-all border border-red-500/20"
            >
              {t.exit}
            </button>
        </div>
      </aside>

      {/* Center: Main drawing area and tools */}
      <main className="flex-1 flex flex-col gap-2 md:gap-4 p-2 md:p-4 min-h-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden flex justify-between items-center bg-card-bg p-2 rounded-xl shadow-sm border border-black/5">
            <button onClick={() => setIsPlayersVisible(true)} className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold opacity-40 uppercase">
                {gameState === 'drawing' ? t.guessWord : t.roomId}
              </span>
              <span className="font-mono font-bold text-sm">
                {gameState === 'drawing' ? '???'.padEnd(roomId.length, '_') : roomId}
              </span>
            </div>
             {gameState === 'drawing' && (
              <div className="flex flex-col items-center bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                <span className="text-[10px] font-bold text-primary uppercase leading-none">{t.time}</span>
                <span className="text-lg font-black text-primary leading-none">{timer}s</span>
              </div>
            )}
        </div>

        {/* Toolbar for Desktop */}
        <div className="hidden lg:flex bg-card-bg rounded-xl shadow-sm p-4 justify-between items-center border border-black/5">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold opacity-40 uppercase">
                  {gameState === 'drawing' ? t.guessWord : t.roomId}
                </span>
                <span className="font-mono font-bold">
                  {gameState === 'drawing' ? '???' : roomId}
                </span>
              </div>
              {gameState === 'drawing' && (
                <div className="flex flex-col items-center bg-primary/10 px-4 py-1 rounded-lg border border-primary/20">
                  <span className="text-[10px] font-bold text-primary uppercase leading-none mb-1">{t.time}</span>
                  <span className="text-xl font-black text-primary leading-none">{timer}s</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 flex-wrap max-w-[200px]">
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush'); }}
                  disabled={!isDrawer || gameState !== 'drawing'}
                  className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${color === c && tool !== 'eraser' ? 'border-primary scale-110' : 'border-black/10'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 bg-black/5 p-2 rounded-lg">
               <button onClick={() => setTool('brush')} disabled={!isDrawer || gameState !== 'drawing'} className={`p-2 rounded-lg transition-colors ${tool === 'brush' ? 'bg-primary text-white' : 'hover:bg-black/10'}`} title="Brush">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => setTool('eraser')} disabled={!isDrawer || gameState !== 'drawing'} className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-primary text-white' : 'hover:bg-black/10'}`} title="Eraser">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 01-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" /></svg>
              </button>
              <button onClick={() => setTool('fill')} disabled={!isDrawer || gameState !== 'drawing'} className={`p-2 rounded-lg transition-colors ${tool === 'fill' ? 'bg-primary text-white' : 'hover:bg-black/10'}`} title="Flood Fill">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 17h2v2h-2v-2m-2-2h2v2h-2v-2m-2-2h2v2h-2v-2m-2-2h2v2h-2v-2m-2-2h2v2h-2v-2M5 19h10v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m14-10v8h-2V5h-1L15 4H9L8 5H7v8H5V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2z" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} disabled={!isDrawer || gameState !== 'drawing'} className="w-32 accent-primary disabled:opacity-30" />
              <span className="font-bold w-6">{brushSize}</span>
            </div>
        </div>

        {/* Drawing Board */}
        <div className="flex-1 min-h-0">
          {socketRef.current && (
            <DrawingBoard color={color} brushSize={brushSize} roomId={roomId} socket={socketRef.current} isDrawingMode={isDrawer && gameState === 'drawing'} tool={tool} history={drawingHistory} />
          )}
        </div>

         {/* Toolbar for Mobile */}
        <div className="lg:hidden flex flex-wrap gap-2 p-2 bg-card-bg rounded-xl shadow-sm border border-black/5 justify-center">
            <div className="flex gap-1 flex-wrap justify-center">
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush'); }}
                  disabled={!isDrawer || gameState !== 'drawing'}
                  className={`w-7 h-7 rounded-md border-2 ${color === c && tool !== 'eraser' ? 'border-primary scale-110' : 'border-black/10'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 bg-black/5 p-1 rounded-lg">
               <button onClick={() => setTool('brush')} disabled={!isDrawer || gameState !== 'drawing'} className={`p-2 rounded-lg ${tool === 'brush' ? 'bg-primary text-white' : ''}`} title="Brush">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => setTool('eraser')} disabled={!isDrawer || gameState !== 'drawing'} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-primary text-white' : ''}`} title="Eraser">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 01-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" /></svg>
              </button>
              <button onClick={() => setTool('fill')} disabled={!isDrawer || gameState !== 'drawing'} className={`p-2 rounded-lg ${tool === 'fill' ? 'bg-primary text-white' : ''}`} title="Flood Fill">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 17h2v2h-2v-2m-2-2h2v2h-2v-2m-2-2h2v2h-2v-2m-2-2h2v2h-2v-2m-2-2h2v2h-2v-2M5 19h10v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m0-2h2v2H5v-2m14-10v8h-2V5h-1L15 4H9L8 5H7v8H5V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2z" /></svg>
              </button>
            </div>
             <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} disabled={!isDrawer || gameState !== 'drawing'} className="w-24 accent-primary disabled:opacity-30" />
        </div>
      </main>

      {/* Right Sidebar (Chat) - Hidden on mobile */}
      <aside className="w-80 bg-card-bg border-l border-black/5 flex-col h-full hidden lg:flex">
        <div className="p-4 border-b border-black/5 font-bold uppercase">{t.chat}</div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2">
           {[...messages].reverse().map((m, i) => (
            <div key={i} className={`text-sm ${m.user === 'System' ? 'italic opacity-50' : ''} ${m.isCorrect ? 'text-green-600 font-bold' : ''}`}>
              <span className="font-bold mr-2">{m.user}:</span>
              <span>{m.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5">
          <input 
            type="text" 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={isDrawer && gameState === 'drawing'}
            placeholder={isDrawer && gameState === 'drawing' ? t.youAreDrawing : t.typeGuess}
            className="w-full bg-background border border-black/5 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors font-medium disabled:opacity-50"
          />
        </form>
      </aside>

      {/* Mobile-only Chat - This is not a drawer, but a visible part of the layout */}
       <div className="lg:hidden flex flex-col bg-card-bg border-t border-black/5">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2 h-32 md:h-40">
             {[...messages].reverse().map((m, i) => (
              <div key={i} className={`text-sm ${m.user === 'System' ? 'italic opacity-50' : ''} ${m.isCorrect ? 'text-green-600 font-bold' : ''}`}>
                <span className="font-bold mr-2">{m.user}:</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5">
            <input 
              type="text" 
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={isDrawer && gameState === 'drawing'}
              placeholder={isDrawer && gameState === 'drawing' ? t.youAreDrawing : t.typeGuess}
              className="w-full bg-background border border-black/5 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors font-medium disabled:opacity-50"
            />
          </form>
        </div>
    </div>
  );
}