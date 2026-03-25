'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, use, useEffect, useRef } from 'react';
import DrawingBoard from '@/components/DrawingBoard';
import TimerClock from '@/components/TimerClock'; // Import the new component
import { io, Socket } from 'socket.io-client';
import { translations } from '@/lib/translations';
import useSound from '@/hooks/useSound'; // Import the sound hook

interface Player {
  id: string;
  nickname: string;
  points: number;
  disconnected?: boolean;
  isSpectator?: boolean;
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
  const { playSound, toggleMute, isMuted } = useSound();

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
  const isSpectator = players.find(p => p.id === socketRef.current?.id)?.isSpectator || false;
  const prevPlayerCountRef = useRef(players.length);

  const [wordSelectionTime, setWordSelectionTime] = useState(0);
  const [wordLength, setWordLength] = useState(0);

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
      if (msg.isCorrect) {
        playSound('guess');
      }
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('update_players', (updatedPlayers: Player[]) => {
      if (prevPlayerCountRef.current < updatedPlayers.length) {
        playSound('join');
      } else if (prevPlayerCountRef.current > updatedPlayers.length) {
        playSound('leave');
      }
      prevPlayerCountRef.current = updatedPlayers.length;
      setPlayers(updatedPlayers);
    });

    socket.on('round_start', (data: any) => {
      playSound('round');
      if (socketRef.current?.id === data.drawerId) { // Only the new drawer clears the canvas for everyone
        socketRef.current?.emit('clear_canvas', roomId);
      }
      setDrawingHistory([]); // Optimistically clear for everyone immediately
      setGameState(data.gameState);
      setCurrentDrawerId(data.drawerId);
      setWordOptions([]);
      if(data.wordSelectionTime) {
        setWordSelectionTime(data.wordSelectionTime);
      }
    });

    socket.on('word_options', (options: string[]) => {
      setWordOptions(options);
    });

    socket.on('game_state_update', (data: any) => {
      setGameState(data.gameState);
      if (data.wordLength) {
        setWordLength(data.wordLength);
      }
    });

    socket.on('timer_update', (timeLeft: number) => {
      if (timeLeft > 0 && timeLeft <= 10 && timeLeft < timer) { // also check if timer is decreasing
        playSound('time');
      }
      setTimer(timeLeft);
    });

    socket.on('game_over', (data: { winner: string }) => {
      playSound('win');
      setWinner(data.winner);
      setGameState('waiting');
      // Clear winner after 5 seconds and reset word selection time
      setTimeout(() => {
        setWinner(null);
        setWordSelectionTime(0);
      }, 5000);
    });

    socket.on('history_update', (history) => {
      setDrawingHistory(history);
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
          <div className="sketchy-container p-12 animate-bounce">
            <h2 className="text-5xl font-black italic text-primary">{t.gameOver}</h2>
            <div className="flex flex-col items-center">
              <span className="text-3xl opacity-70 uppercase font-bold">{t.winnerIs}</span>
              <span className="text-6xl font-black">{winner}</span>
            </div>
          </div>
        </div>
      )}
      {isDrawer && gameState === 'selecting_word' && wordOptions.length > 0 && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sketchy-container flex flex-col items-center gap-6 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-black tracking-tight text-center uppercase">{t.chooseWord}</h2>
              <TimerClock timeLeft={timer} totalTime={wordSelectionTime} size={80} />
            </div>
            <div className="flex flex-col gap-3 w-full">
              {wordOptions.map((word) => (
                <button
                  key={word}
                  onClick={() => handleSelectWord(word)}
                  className="sketchy-btn w-full text-2xl"
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
          <div className="sketchy-popup uppercase">
            {t.waitingPlayers}
          </div>
          <button 
            onClick={handleStartGame}
            className="sketchy-btn uppercase text-xl"
          >
            {t.startSolo}
          </button>
        </div>
      )}
      {gameState === 'selecting_word' && !isDrawer && (
        <div className="absolute inset-0 z-40 bg-black/10 flex items-center justify-center">
          <div className="sketchy-popup flex items-center gap-3 uppercase">
            <span>{t.drawerChoosing}</span>
            <TimerClock timeLeft={timer} totalTime={wordSelectionTime} size={40} />
          </div>
        </div>
      )}

      {/* Left Sidebar (Players) - Hidden on mobile, drawer behavior */}
      <aside className={`absolute lg:relative z-30 w-64 sketchy-container flex-col h-full transition-transform duration-300 ease-in-out transform ${isPlayersVisible ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex`}>
        <div className="p-4 border-b-2 border-foreground font-bold flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-lg opacity-50 uppercase">{t.players}</span>
            <span className="text-2xl">{players.length}/10</span>
          </div>
          <button onClick={() => setIsPlayersVisible(false)} className="lg:hidden p-2 rounded-full -mr-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button 
            onClick={handleExit}
            className="sketchy-btn secondary uppercase text-xs"
          >
            {t.exit}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
           {players.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center gap-3 p-2 transition-colors sketchy-popup ${player.disconnected ? 'opacity-40 grayscale' : ''}`}>
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
                <span className="font-bold text-lg truncate max-w-[120px]">{player.nickname}</span>
                <span className="text-md opacity-50">{player.points} {t.points}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 lg:hidden border-t border-black/5">
            <button 
              onClick={handleExit}
              className="sketchy-btn secondary w-full"
            >
              {t.exit}
            </button>
        </div>
        <div className="p-4">
          {/* Yandex.RTB R-A-18971199-1 */}
          <div id="yandex_rtb_R-A-18971199-1"></div>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.yaContextCb.push(() => {
                  Ya.Context.AdvManager.render({
                    "blockId": "R-A-18971199-1",
                    "renderTo": "yandex_rtb_R-A-18971199-1"
                  })
                })
              `,
            }}
          />
        </div>
      </aside>

      {/* Center: Main drawing area and tools */}
      <main className="flex-1 flex flex-col gap-2 md:gap-4 p-2 md:p-4 min-h-0 relative">

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          {gameState === 'drawing' && drawTime && (
            <TimerClock timeLeft={timer} totalTime={drawTime} size={50} />
          )}
          {gameState === 'drawing' && !isDrawer && wordLength > 0 && (
            <div className="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg sketchy-container">
              {Array.from({ length: wordLength }).map((_, i) => (
                <span key={i} className="w-6 h-8 md:w-8 md:h-10 bg-gray-200 rounded-md flex items-center justify-center text-2xl font-bold"></span>
              ))}
            </div>
          )}
        </div>

        {isSpectator && (
          <div className="absolute bottom-4 right-4 bg-yellow-500 text-white font-bold py-2 px-4 rounded-full shadow-lg z-50">
            You are spectating
          </div>
        )}



        {/* Drawing Board */}
        <div className="flex-1 min-h-0 sketchy-container">
          {socketRef.current && (
            <DrawingBoard color={color} brushSize={brushSize} roomId={roomId} socket={socketRef.current} isDrawingMode={isDrawer && gameState === 'drawing'} tool={tool} history={drawingHistory} />
          )}
        </div>

        {/* Toolbar */}
        <div className="w-full pt-2">
          <div className="sketchy-container flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm p-2">
            {/* Color Palette */}
            <div className="flex flex-wrap gap-1 justify-center">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush'); }}
                  disabled={!isDrawer || gameState !== 'drawing'}
                  className={`w-7 h-7 transition-transform hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 sketchy-popup ${color === c && tool !== 'eraser' ? 'border-primary scale-110 border-2' : 'border-black/10'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-4">
              {/* Player List Toggle for Mobile */}
              <button onClick={() => setIsPlayersVisible(!isPlayersVisible)} className="sketchy-btn lg:hidden !p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.002 3.002 0 014.288 0M12 15a4 4 0 100-8 4 4 0 000 8z" /></svg>
              </button>

              {/* Mute Button */}
              <button onClick={toggleMute} className="sketchy-btn !p-2">
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.586a2 2 0 002.828 0L12 12m0 0l3.586-3.586a2 2 0 10-2.828-2.828L9.172 9.172m4.242 4.242a2 2 0 010 2.828l-1.414 1.414a2 2 0 01-2.828 0L6 18.828m12-12a2 2 0 00-2.828 0l-1.414 1.414a2 2 0 000 2.828l4.242 4.242 1.414-1.414a2 2 0 000-2.828l-1.414-1.414z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.586a2 2 0 002.828 0L12 12m0 0l3.586-3.586a2 2 0 10-2.828-2.828L9.172 9.172" /></svg>
                )}
              </button>

              {/* Tool Buttons */}
              <div className="flex items-center gap-1 sketchy-container p-1">
                 <button onClick={() => setTool('brush')} disabled={!isDrawer || gameState !== 'drawing'} className={`sketchy-btn !p-2 ${tool === 'brush' ? 'bg-primary text-white' : ''}`} title="Brush">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => setTool('eraser')} disabled={!isDrawer || gameState !== 'drawing'} className={`sketchy-btn !p-2 ${tool === 'eraser' ? 'bg-primary text-white' : ''}`} title="Eraser">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 01-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" /></svg>
                </button>
                 <button onClick={() => setTool('fill')} disabled={!isDrawer || gameState !== 'drawing'} className={`sketchy-btn !p-2 ${tool === 'fill' ? 'bg-primary text-white' : ''}`} title="Flood Fill">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3a1 1 0 00-1 1v3.586l-3.293-3.293a1 1 0 10-1.414 1.414L10.586 9H7a1 1 0 00-1 1c0 4.418 3.582 8 8 8s8-3.582 8-8a1 1 0 00-1-1h-3.586l4.293-4.293a1 1 0 10-1.414-1.414L13 7.586V4a1 1 0 00-1-1z" /></svg>
                </button>
              </div>

              {/* Brush Size Slider */}
              <div className="flex items-center gap-2">
                <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} disabled={!isDrawer || gameState !== 'drawing'} className="w-32 accent-primary disabled:opacity-30" />
                <span className="font-bold w-10 text-center">{brushSize}</span>
              </div>
              
              {/* Undo/Clear Buttons */}
              <div className="flex items-center gap-1 sketchy-container p-1">
                  <button onClick={() => socketRef.current?.emit('undo', roomId)} disabled={!isDrawer || gameState !== 'drawing' || drawingHistory.length === 0} className="sketchy-btn !p-2" title="Undo">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" /></svg>
                  </button>
                  <button onClick={() => socketRef.current?.emit('clear_canvas', roomId)} disabled={!isDrawer || gameState !== 'drawing'} className="sketchy-btn !p-2" title="Clear Canvas">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar (Chat) - Hidden on mobile */}
      <aside className="w-80 sketchy-container flex-col h-full hidden lg:flex">
        <div className="p-4 border-b-2 border-foreground font-bold uppercase text-2xl">{t.chat}</div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2">
           {[...messages].reverse().map((m, i) => (
            <div key={i} className={`text-lg ${m.user === 'System' ? 'italic opacity-50' : ''} ${m.isCorrect ? 'text-green-600 font-bold' : ''}`}>
              <span className="font-bold mr-2">{m.user}:</span>
              <span>{m.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-foreground">
          <input 
            type="text" 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={isDrawer && gameState === 'drawing'}
            placeholder={isDrawer && gameState === 'drawing' ? t.youAreDrawing : t.typeGuess}
            className="sketchy-input"
          />
        </form>
      </aside>

      {/* Mobile-only Chat - This is not a drawer, but a visible part of the layout */}
       <div className="lg:hidden flex flex-col sketchy-container">
          <div className="overflow-y-auto p-4 flex flex-col-reverse gap-2 h-20">
             {[...messages].slice(0, 4).map((m, i) => (
              <div key={i} className={`text-sm ${m.user === 'System' ? 'italic opacity-50' : ''} ${m.isCorrect ? 'text-green-600 font-bold' : ''}`}>
                <span className="font-bold mr-2">{m.user}:</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-foreground">
            <input 
              type="text" 
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={isDrawer && gameState === 'drawing'}
              placeholder={isDrawer ? t.youAreDrawing : t.typeGuess}
              className="sketchy-input"
            />
          </form>
        </div>
    </div>
  );
}
