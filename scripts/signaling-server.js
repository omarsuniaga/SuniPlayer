const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;
const httpServer = http.createServer();

// Whitelist de orígenes permitidos
const ALLOWED_ORIGINS = [
    "http://localhost:5173", // Vite default
    "http://localhost:4173", // Vite preview
    "https://suniplayer.netlify.app", // Producción (ejemplo)
    "https://suniplayer.com"
];

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`[Security] Origen bloqueado: ${origin}`);
                callback(new Error('Origin not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e6 // 1MB max message size to prevent buffer overflow attacks
});

// rooms[roomCode] = { leader: socketId, members: Set(), passcode: string }
const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`[Signaling] Nuevo dispositivo conectado: ${socket.id}`);

    socket.on('join-room', ({ roomCode, passcode }) => {
        // Sanitizar roomCode para evitar inyecciones de logs
        const safeRoomCode = String(roomCode).substring(0, 32).replace(/[^a-zA-Z0-0]/g, '');
        
        if (!rooms.has(safeRoomCode)) {
            // Primer usuario en llegar es el líder
            rooms.set(safeRoomCode, {
                leader: socket.id,
                members: new Set([socket.id]),
                passcode: passcode || null
            });
            socket.join(safeRoomCode);
            socket.emit('room-joined', { role: 'leader' });
            console.log(`[Signaling] ${socket.id} creó sala LÍDER: ${safeRoomCode}`);
        } else {
            const room = rooms.get(safeRoomCode);
            // Si la sala tiene clave, hay que validarla
            if (room.passcode && room.passcode !== passcode) {
                socket.emit('error', { message: 'Código de acceso incorrecto' });
                return;
            }
            
            room.members.add(socket.id);
            socket.join(safeRoomCode);
            socket.emit('room-joined', { role: 'follower' });
            console.log(`[Signaling] ${socket.id} se unió a la sala: ${safeRoomCode}`);
            
            // Avisar a los demás en la sala que hay alguien nuevo
            socket.to(safeRoomCode).emit('new-peer', socket.id);
        }
    });

    socket.on('signal', ({ to, signal, roomCode }) => {
        // Validación básica: el socket debe estar en la sala
        if (!socket.rooms.has(roomCode)) {
            console.warn(`[Security] ${socket.id} intentó señalizar fuera de su sala: ${roomCode}`);
            return;
        }

        console.log(`[Signaling] Reenviando señal de ${socket.id} -> ${to}`);
        io.to(to).emit('signal', {
            from: socket.id,
            signal
        });
    });

    socket.on('disconnecting', () => {
        for (const roomCode of socket.rooms) {
            if (rooms.has(roomCode)) {
                const room = rooms.get(roomCode);
                room.members.delete(socket.id);
                if (room.leader === socket.id) {
                    // Si el líder se va, avisamos a todos o disolvemos
                    socket.to(roomCode).emit('leader-left');
                    rooms.delete(roomCode);
                } else if (room.members.size === 0) {
                    rooms.delete(roomCode);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Signaling] Dispositivo desconectado: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Servidor de Señalización SyncEnsemble SEGURO corriendo en puerto ${PORT}`);
    console.log(`Usa esta dirección para que los dispositivos se encuentren.\n`);
});
