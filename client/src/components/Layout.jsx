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

    const [showMobileChat, setShowMobileChat] = useState(false);

    useEffect(() => {
        const handleReconnect = () => {
            console.log("Socket reconnected. Re-joining room:", currentRoom.id);
            if (currentRoom.id !== 'general' && currentRoom.type === 'public') {
                socket.emit('joinRoom', currentRoom.id);
            } else if (currentRoom.type === 'private') {
                socket.emit('joinPrivateRoom', currentRoom.id);
            }
        };

        socket.on('connect', handleReconnect);

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
            // Only clear messages if we actually CHANGED rooms (or it's a fresh join)
            // But 'joinedRoom' fires on reconnect too now.
            // We should check if it's the SAME room we are already in?
            // If we re-join the same room, maybe don't clear?
            // But we might have missed messages.
            // For now, let's allow clear to be safe, or check ID.

            if (roomData.name !== currentRoom.name) {
                setMessages([]);
            }

            setCurrentRoom({
                id: roomData.name,
                name: roomData.name,
                type: roomData.type,
                creator: roomData.creator
            });
            setActiveTab('rooms');
            setShowMobileChat(true); // Switch to chat on mobile
        });

        socket.on('receivePrivateMessage', (msg) => {
            let partnerId;
            if (msg.senderId === socket.id) {
                return; // Ignore self-echo for now
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

        socket.on('error', (err) => alert("Error: " + err));

        return () => {
            socket.off('connect', handleReconnect);
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
        setShowMobileChat(false); // Go back to list
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
        setShowMobileChat(true); // Switch to chat
    };

    const handleBackToSidebar = () => {
        setShowMobileChat(false);
    };

    // Determine messages to show
    let displayMessages = [];
    if (currentRoom.type === 'private') {
        displayMessages = privateChats[currentRoom.id]?.messages || [];
    } else {
        displayMessages = messages;
    }

    return (
        <div className="app-container" style={{ display: 'flex', width: '90vw', height: '90vh', maxWidth: '1400px', gap: '20px' }}>
            <div className={`sidebar-wrapper ${showMobileChat ? 'hidden-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
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
            </div>
            <div className={`chat-wrapper ${!showMobileChat ? 'hidden-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ChatArea
                    socket={socket}
                    messages={displayMessages}
                    currentRoom={currentRoom}
                    currentUser={socket}
                    onBack={handleBackToSidebar}
                />
            </div>
        </div>
    );
};

export default Layout;
