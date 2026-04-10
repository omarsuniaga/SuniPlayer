// scripts/signaling-server.js
const { Server } = require('socket.io');
const http = require('http');

const PORT = 3001;
const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*", // En desarrollo permitimos todo
        methods: ["GET", "POST"]
    }
});

// rooms[roomCode] = [socketId1, socketId2, ...]
const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`[Signaling] Nuevo dispositivo conectado: ${socket.id}`);

    socket.on('join-room', (roomCode) => {
        socket.join(roomCode);
        console.log(`[Signaling] ${socket.id} se unió a la sala: ${roomCode}`);
        
        // Avisar a los demás en la sala que hay alguien nuevo para iniciar WebRTC
        socket.to(roomCode).emit('new-peer', socket.id);
    });

    socket.on('signal', ({ to, signal, roomCode }) => {
        // Reenviar la señal WebRTC al destinatario
        console.log(`[Signaling] Reenviando señal de ${socket.id} -> ${to}`);
        io.to(to).emit('signal', {
            from: socket.id,
            signal
        });
    });

    socket.on('disconnect', () => {
        console.log(`[Signaling] Dispositivo desconectado: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Servidor de Señalización SyncEnsemble corriendo en http://localhost:${PORT}`);
    console.log(`Usa esta dirección para que los dispositivos se encuentren.\n`);
});
