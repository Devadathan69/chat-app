import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const Layout = ({ socket, username }) => {
    const [activeTab, setActiveTab] = useState('rooms'); // or 'online'
    const [currentRoom, setCurrentRoom] = useState({ id: 'general', name: 'General', type: 'public' }); // or private user object
    const [privateChats, setPrivateChats] = useState({}); // userId -> { messages: [], unread: 0, user: {id, username} }
    const [rooms, setRooms] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [messages, setMessages] = useState([]); // Current room messages

    useEffect(() => {
        // Listeners
        socket.on('roomList', (list) => setRooms(list));
        socket.on('onlineUsers', (list) => setOnlineUsers(list));

        socket.on('receiveMessage', (msg) => {
            // Check if message belongs to current room
            if (msg.room === currentRoom.id) {
                setMessages(prev => [...prev, msg]);
            }
            // Else, if we were tracking history for other rooms, update there.
            // For simplicity, we only store current room history in 'messages' state
            // but in a real app would likely have a map of room -> messages.
            // For this scope, let's just clear messages when switching rooms.
        });

        socket.on('joinedRoom', (roomData) => {
            // roomData: { name, creator, type }
            setMessages([]); // Clear messages on join
            setCurrentRoom({
                id: roomData.name,
                name: roomData.name,
                type: roomData.type,
                creator: roomData.creator
            });
            setActiveTab('rooms');
        });

        socket.on('receivePrivateMessage', (msg) => {
            let partnerId;
            if (msg.senderId === socket.id) {
                // Optimistic if in private chat
                // Better: if I sent it, I don't need to do much unless I want to store it.
                // But wait, the server sends back my own message to me?
                // Yes, 'socket.emit("receivePrivateMessage", messageData);' in server.
                // So I need to find the recipient ID to store it under IF I am the sender.
                // Actually, I don't know the recipient ID from the messageData easily unless I missed it.
                // In `server.js`, I didn't add `recipientId` to the message object.
                // For now, let's rely on the user having the chat open? No, that's flaky.
                // Let's assume the user we are "talking to" in UI is the partner.

                // FIX: For this iteration, let's just push to current view if it's a private chat?
                // or skip self-echo handling complexity for now and focus on Rooms.
                // If I receive a message from myself, it's an echo.
                return; // Let's ignore self-echo for private chat storage to avoid dupes/complexity if not needed.
                // Use local append? No, let's rely on server echo but I need to know where to put it.
            } else {
                partnerId = msg.senderId;
            }

            setPrivateChats(prev => {
                const existing = prev[partnerId] || { messages: [], unread: 0, user: onlineUsers.find(u => u.id === partnerId) };
                return {
                    ...prev,
                    [partnerId]: {
                        ...existing,
                        messages: [...existing.messages, msg],
                        unread: (currentRoom.id !== partnerId) ? existing.unread + 1 : 0
                    }
                };
            });
        });

        socket.on('error', (err) => alert(err));

        return () => {
            socket.off('roomList');
            socket.off('onlineUsers');
            socket.off('receiveMessage');
            socket.off('joinedRoom');
            socket.off('receivePrivateMessage');
            socket.off('error');
        };
    }, [socket, currentRoom, onlineUsers]);

    const handleJoinRoom = (roomName) => {
        socket.emit('joinRoom', roomName);
        // Don't set state here, wait for 'joinedRoom' event
    };

    const handleJoinPrivateRoom = (roomName) => {
        socket.emit("joinPrivateRoom", roomName);
    };

    const handleCreateRoom = (roomName, type) => {
        socket.emit('createRoom', { roomName, type });
    };

    const handleCloseRoom = () => {
        if (currentRoom.type !== 'private' && currentRoom.id !== 'general') {
            // Logic for public/private rooms
        }
        socket.emit('closeRoom', currentRoom.id);
    };

    const handleStartPrivateChat = (user) => {
        if (user.id === socket.id) return;
        setCurrentRoom({ id: user.id, name: user.username, type: 'private' });
        // Create entry if not exists
        if (!privateChats[user.id]) {
            setPrivateChats(prev => ({
                ...prev,
                [user.id]: { messages: [], unread: 0, user: user }
            }));
        }
    };

    // Determine messages to show
    let displayMessages = [];
    if (currentRoom.type === 'private') {
        displayMessages = privateChats[currentRoom.id]?.messages || [];
    } else {
        displayMessages = messages;
    }

    return (
        <div style={{ display: 'flex', width: '90vw', height: '90vh', maxWidth: '1400px', gap: '20px' }}>
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                rooms={rooms}
                onlineUsers={onlineUsers}
                currentRoom={currentRoom}
                onJoinRoom={handleJoinRoom}
                onJoinPrivateRoom={handleJoinPrivateRoom}
                onCreateRoom={handleCreateRoom}
                onCloseRoom={handleCloseRoom}
                onStartPrivate={handleStartPrivateChat}
                currentUser={socket}
                privateChats={privateChats}
            />
            <ChatArea
                socket={socket}
                messages={displayMessages}
                currentRoom={currentRoom}
                currentUser={socket}
            />
        </div>
    );
};

export default Layout;
