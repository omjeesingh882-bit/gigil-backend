const socketIo = require('socket.io');

let io;
const activeRooms = new Map(); // roomCode -> { users: [], playlist: [], currentSong: {}, hostId: '', currentPosition: 0 }

module.exports = function (server) {
    io = socketIo(server, {
        cors: {
            origin: '*', // For development
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Create a room
        socket.on('create_room', (data) => {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const user = { id: socket.id, username: data.username, isHost: true, avatar: data.avatar };

            activeRooms.set(roomCode, {
                users: [user],
                playlist: [],
                currentSong: null,
                hostId: socket.id,
                currentPosition: 0,
                isPlaying: false
            });

            socket.join(roomCode);
            socket.emit('room_created', { roomCode, room: activeRooms.get(roomCode) });
        });

        // Join a room
        socket.on('join_room', (data) => {
            const { roomCode, username, avatar } = data;
            const room = activeRooms.get(roomCode);

            if (room) {
                const user = { id: socket.id, username, isHost: false, avatar };
                room.users.push(user);
                socket.join(roomCode);

                // Notify others
                socket.to(roomCode).emit('user_joined', user);

                // Send current state to new user
                socket.emit('room_joined', { roomCode, room });
            } else {
                socket.emit('error', { message: 'Room not found' });
            }
        });

        // Add song
        socket.on('add_song', (data) => {
            const { roomCode, song } = data; // song: { id, title, artist, url, addedBy }
            const room = activeRooms.get(roomCode);

            if (room) {
                room.playlist.push(song);
                if (!room.currentSong) {
                    room.currentSong = song;
                    room.isPlaying = true; // Auto play first song
                }
                io.to(roomCode).emit('playlist_updated', room.playlist);
                if (room.currentSong === song) {
                    io.to(roomCode).emit('song_changed', room.currentSong);
                }
            }
        });

        // Sync playback
        socket.on('sync_playback', (data) => {
            const { roomCode, position, timestamp, isPlaying } = data;
            const room = activeRooms.get(roomCode);

            if (room && room.hostId === socket.id) {
                room.currentPosition = position;
                room.isPlaying = isPlaying;
                // Broadcast to clients
                socket.to(roomCode).emit('sync_update', {
                    position,
                    timestamp,
                    isPlaying
                });
            }
        });

        // Chat message
        socket.on('send_message', (data) => {
            const { roomCode, text, username, avatar } = data;
            io.to(roomCode).emit('new_message', {
                text,
                username,
                avatar,
                timestamp: Date.now()
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Clean up rooms
            for (const [roomCode, room] of activeRooms.entries()) {
                const userIndex = room.users.findIndex(u => u.id === socket.id);
                if (userIndex !== -1) {
                    const user = room.users[userIndex];
                    room.users.splice(userIndex, 1);
                    socket.to(roomCode).emit('user_left', { id: user.id });

                    if (room.users.length === 0) {
                        activeRooms.delete(roomCode);
                    } else if (user.isHost) {
                        // Assign new host
                        room.users[0].isHost = true;
                        room.hostId = room.users[0].id;
                        io.to(roomCode).emit('new_host', { id: room.hostId });
                    }
                    break;
                }
            }
        });
    });
};
