import { useEffect, useRef } from 'react';
import Message from './Message';
import InputArea from './InputArea';
import { FaArrowLeft } from 'react-icons/fa';

const ChatArea = ({ socket, messages, currentRoom, currentUser, onBack }) => {
    const scrollRef = useRef();

    if (!currentRoom) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Select a room to start chatting</div>;

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (data) => {
        // data: { type, content, fileName?, language? }
        if (currentRoom.type === 'private') {
            socket.emit('sendPrivateMessage', {
                toSocketId: currentRoom.id,
                ...data
            });
        } else {
            socket.emit('sendMessage', data);
        }
    };

    return (
        <div className="glass-panel" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%'
        }}>
            {/* Header */}
            <div style={{
                padding: '15px',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <button
                    className="mobile-back-btn"
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'none' // Hidden by default, shown via CSS on mobile
                    }}
                >
                    <FaArrowLeft />
                </button>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {currentRoom.type === 'private' ? `@${String(currentRoom.name)}` : `#${String(currentRoom.name)}`}
                </div>
                {currentRoom.type === 'private' && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: 'auto' }}>Private Chat</div>
                )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.map((msg, index) => (
                    <Message
                        key={msg.id || index}
                        msg={msg}
                        isMe={msg.sender === currentUser.username}
                    />
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <InputArea onSendMessage={handleSendMessage} />
        </div>
    );
};

export default ChatArea;
