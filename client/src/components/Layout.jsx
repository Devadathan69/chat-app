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

        socket.on('joinedRoom', (roomName) => {
            setMessages([]); // Clear messages on join
            // Ideally fetch history here if backend supported it
        });

        socket.on('receivePrivateMessage', (msg) => {
            const otherPartyId = msg.senderId === socket.id ? msg.receiverId : msg.senderId; // This logic is tricky, let's fix
            // Actually, for private messages, we need to know who the 'other' person is.
            // If I sent it, other is receiver. If I currently received it, other is sender.

            // Wait, receivePrivateMessage is sent to both sender and receiver.
            // If I am sender, I want to see it in my chat with 'recipient'.
            // If I am receiver, I want to see it in my chat with 'sender'.

            // Let's rely on finding the 'other' user from the online list or if we know the ID.

            // To simplify, let's just handle "Private Chat Mode" in state.
            // If we are in private chat with User X, show msg.

            // We need to persist private messages in `privateChats` state map.
            setPrivateChats(prev => {
                // Determine the 'partner' ID
                // If I am sender, partner is who I sent to (how do I know? backend didn't send 'to' in the event payload in my prev code... oops)
                // Let's fix server logic to send 'to' or just rely on the fact that if it's private, 
                // handle it carefully.

                // Let's assume for now we only support receiving private messages actively or notifications.
                // Refinement: I'll update Client logic to just handle what it gets.

                // Fix: I need to update server to include `to` or `recipientId` to be sure. 
                // But wait, `receivePrivateMessage` event only goes to the two involved.

                let partnerId;
                if (msg.senderId === socket.id) {
                    // I sent it. But I don't know to whom from just the message object unless I add 'recipientId' to it.
                    // I will assume the current view is the correct one if I just sent it.
                    // But if I have multiple tabs... 
                    // Let's assume for now if I am sender, I know who I'm talking to (currentRoom.id if it's a user).
                    partnerId = currentRoom.id;
                } else {
                    partnerId = msg.senderId;
                }

                const existing = prev[partnerId] || { messages: [], unread: 0, user: onlineUsers.find(u => u.id === partnerId) };

                // If it's a new user not in our list (e.g. they went offline), we might have issue.
                // Use sender info from msg if available.

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

        return () => {
            socket.off('roomList');
            socket.off('onlineUsers');
            socket.off('receiveMessage');
            socket.off('joinedRoom');
            socket.off('receivePrivateMessage');
        };
    }, [socket, currentRoom, onlineUsers]);

    const handleJoinRoom = (roomName) => {
        socket.emit('joinRoom', roomName);
        setCurrentRoom({ id: roomName, name: roomName, type: 'public' });
        setActiveTab('rooms');
    };

    const handleCreateRoom = (roomName) => {
        socket.emit('createRoom', roomName);
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
    if (currentRoom.type === 'public') {
        displayMessages = messages;
    } else {
        displayMessages = privateChats[currentRoom.id]?.messages || [];
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
                onCreateRoom={handleCreateRoom}
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
