const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const wordList = require('./words');

const translations = {
  English: {
    joinedRoom: 'joined the room!',
    leftRoom: 'left the room.',
    guessedWord: 'guessed the word!',
    everyoneGuessed: 'Everyone guessed! The word was:',
    timesUp: "Time's up! The word was:",
    youDrawingMsg: 'You are drawing:'
  },
  Русский: {
    joinedRoom: 'присоединился к комнате!',
    leftRoom: 'покинул комнату.',
    guessedWord: 'угадал слово!',
    everyoneGuessed: 'Все угадали! Слово было:',
    timesUp: 'Время вышло! Слово было:',
    youDrawingMsg: 'Вы рисуете:'
  }
};

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development. Change to your Vercel URL in production for better security.
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();
const SELECT_TIME = 15;
const DRAW_TIME = 60;

function getRandomWords(roomId, count = 2) {
  const room = rooms.get(roomId);
  const lang = room?.language || 'English';
  const list = wordList[lang] || wordList['English'];
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function stopTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

function startTimer(roomId, type) {
  const room = rooms.get(roomId);
  if (!room) return;

  stopTimer(room);

  room.timeLeft = type === 'selecting' ? SELECT_TIME : (room.settings?.drawTime || DRAW_TIME);
  
  io.to(roomId).emit('timer_update', room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(roomId).emit('timer_update', room.timeLeft);

    if (room.timeLeft <= 0) {
      stopTimer(room);
      const t = translations[room.language || 'English'];
      if (type === 'selecting') {
        // Auto-select first word if time runs out
        const drawer = room.players[room.currentDrawerIndex];
        const options = getRandomWords(roomId, 1);
        handleSelectWord(roomId, drawer.id, options[0]);
      } else {
        // Round time over
        io.to(roomId).emit('message', { user: 'System', text: `${t.timesUp} ${room.currentWord}` });
        startNewRound(roomId);
      }
    }
  }, 1000);
}

function handleSelectWord(roomId, socketId, word) {
  const room = rooms.get(roomId);
  if (!room || room.gameState !== 'selecting_word') return;

  const drawer = room.players[room.currentDrawerIndex];
  if (socketId !== drawer.id) return;

  room.currentWord = word.toLowerCase();
  room.gameState = 'drawing';
  
  io.to(roomId).emit('game_state_update', {
      gameState: 'drawing',
      drawerNickname: drawer.nickname
    });

    const t = translations[room.language || 'English'];
    io.to(drawer.id).emit('message', { user: 'System', text: `${t.youDrawingMsg} ${word}` });
    startTimer(roomId, 'drawing');
  }

function startNewRound(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.players.length === 0) return;

  stopTimer(room);

  // Clear canvas for everyone
  io.to(roomId).emit('clear_canvas_receive');

  // Check for winners before starting a new round
  if (room.settings?.pointsLimit) {
    const winner = room.players.find(p => p.points >= room.settings.pointsLimit);
    if (winner) {
      io.to(roomId).emit('game_over', { winner: winner.nickname });
      room.gameState = 'waiting';
      room.players.forEach(p => p.points = 0);
      io.to(roomId).emit('update_players', room.players);
      return;
    }
  }

  // Reset round state
  room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.players.length;
  room.currentWord = '';
  room.guessedPlayers = new Set();
  room.gameState = 'selecting_word';

  const drawer = room.players[room.currentDrawerIndex];
  const options = getRandomWords(roomId, 2);

  io.to(roomId).emit('round_start', {
    drawerId: drawer.id,
    drawerNickname: drawer.nickname,
    gameState: 'selecting_word'
  });

  io.to(drawer.id).emit('word_options', options);
  startTimer(roomId, 'selecting');
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('get_rooms', () => {
    const activeRooms = Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      players: room.players.length, // Only send count to lobby
      language: room.language,
      settings: room.settings
    }));
    socket.emit('rooms_list', activeRooms);
  });

  socket.on('join_room', ({ roomId, nickname, language, userId, settings }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { 
        players: [],
        currentDrawerIndex: -1,
        currentWord: '',
        guessedPlayers: new Set(),
        gameState: 'waiting',
        timer: null,
        timeLeft: 0,
        drawingHistory: [], // Add this line
        language: language || 'English',
        settings: settings || { pointsLimit: 500, drawTime: 60 }
      });
    }
    
    const room = rooms.get(roomId);
    
    // Check if player with same userId is already in room (reconnection)
    const existingPlayer = room.players.find(p => p.userId === userId);
    
    if (existingPlayer) {
      // Update socket ID and mark as active
      existingPlayer.id = socket.id;
      existingPlayer.nickname = nickname; // In case they changed it
      existingPlayer.disconnected = false;
      
      const t = translations[room.language || 'English'];
      io.to(roomId).emit('message', { user: 'System', text: `${nickname} ${t.joinedRoom}` });
      io.to(roomId).emit('update_players', room.players);

      // Restore current game state for reconnected player
      socket.emit('round_start', {
        drawerId: room.players[room.currentDrawerIndex]?.id,
        drawerNickname: room.players[room.currentDrawerIndex]?.nickname,
        gameState: room.gameState
      });
      
      socket.emit('canvas_state_receive', room.drawingHistory);
      socket.emit('timer_update', room.timeLeft);
      
      if (room.gameState === 'selecting_word' && socket.id === room.players[room.currentDrawerIndex]?.id) {
        socket.emit('word_options', getRandomWords(roomId, 2));
      }
      
    } else {
      const player = { id: socket.id, userId, nickname, points: 0, disconnected: false };
      room.players.push(player);
      
      io.to(roomId).emit('update_players', room.players);
      const t = translations[room.language || 'English'];
      io.to(roomId).emit('message', { user: 'System', text: `${nickname} ${t.joinedRoom}` });
      
      if (room.players.filter(p => !p.disconnected).length >= 2 && room.gameState === 'waiting') {
        startNewRound(roomId);
      }
    }
  });

  socket.on('start_game', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.gameState === 'waiting') {
      startNewRound(roomId);
    }
  });

  socket.on('select_word', ({ roomId, word }) => {
    handleSelectWord(roomId, socket.id, word);
  });

  socket.on('draw', ({ roomId, data }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.drawingHistory.push(data);
    }
    socket.to(roomId).emit('draw_receive', data);
  });

  socket.on('clear_canvas', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.drawingHistory = [];
    }
    socket.to(roomId).emit('clear_canvas_receive');
  });

  socket.on('send_message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const text = message.text.toLowerCase().trim();
    const isCorrect = room.gameState === 'drawing' && 
                     text === room.currentWord && 
                     !room.guessedPlayers.has(socket.id) &&
                     socket.id !== room.players[room.currentDrawerIndex].id;

    if (isCorrect) {
      room.guessedPlayers.add(socket.id);
      const player = room.players.find(p => p.id === socket.id);
      const drawer = room.players[room.currentDrawerIndex];

      const points = Math.max(10, 50 - (room.guessedPlayers.size - 1) * 10);
      player.points += points;
      
      // Drawer gets points based on number of players in room
      const pointsForDrawer = room.players.length * 5;
      drawer.points += pointsForDrawer;

      io.to(roomId).emit('update_players', room.players);
      const t = translations[room.language || 'English'];
      io.to(roomId).emit('message', { 
        user: 'System', 
        text: `${player.nickname} ${t.guessedWord} (+${points})`,
        isCorrect: true 
      });

      if (room.guessedPlayers.size === room.players.length - 1) {
        io.to(roomId).emit('message', { user: 'System', text: `${t.everyoneGuessed} ${room.currentWord}` });
        startNewRound(roomId);
      }
    } else {
      io.to(roomId).emit('message', message);
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        player.disconnected = true;
        
        const t = translations[room.language || 'English'];
        io.to(roomId).emit('message', { user: 'System', text: `${player.nickname} ${t.leftRoom}` });
        
        // Wait 30 seconds before removing player completely
        setTimeout(() => {
          const pIndex = room.players.findIndex(p => p.userId === player.userId);
          if (pIndex !== -1 && room.players[pIndex].disconnected) {
            room.players.splice(pIndex, 1);
            io.to(roomId).emit('update_players', room.players);
            
            if (room.players.filter(p => !p.disconnected).length < 2) {
              stopTimer(room);
              room.gameState = 'waiting';
              io.to(roomId).emit('game_state_update', { gameState: 'waiting' });
            } else if (pIndex === room.currentDrawerIndex) {
              room.currentDrawerIndex--;
              startNewRound(roomId);
            }
            
            if (room.players.length === 0) {
              stopTimer(room);
              rooms.delete(roomId);
            }
          }
        }, 30000); // 30 second grace period for reconnection
        
        io.to(roomId).emit('update_players', room.players);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});