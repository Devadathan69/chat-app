import { useEffect, useRef } from 'react';
import Message from './Message';
import InputArea from './InputArea';
import { FaHashtag, FaUserSecret } from 'react-icons/fa';

const ChatArea = ({ socket, messages, currentRoom, currentUser }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (data) => {
        if (currentRoom.type === 'private') {
            socket.emit('sendPrivateMessage', {
                toSocketId: currentRoom.id,
                content: data.content,
                type: data.type,
                fileName: data.fileName,
                language: data.language
            });
        } else {
            socket.emit('sendMessage', {
                ...data,
                // Room info is handled by server state mostly, but good to be explicit if needed. 
                // Our server uses user.room, so we just emit content.
            });
        }
    };

    return (
        <div className="glass-panel" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{
                    width: '45px', height: '45px', borderRadius: '50%',
                    background: 'var(--glass-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', color: 'var(--accent-color)'
                }}>
                    {currentRoom.type === 'private' ? <FaUserSecret /> : <FaHashtag />}
                </div>
                <div>
                    <h2 style={{ fontSize: '1.2rem' }}>{currentRoom.name}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {currentRoom.type === 'private' ? 'Private Conversation' : 'Public Room'}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}
            >
                {messages.length === 0 ? (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: 0.3, color: 'white'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👋</div>
                        <p>No messages here yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <Message
                            key={msg.id || index}
                            msg={msg}
                            isMe={msg.senderId === currentUser.id}
                        />
                    ))
                )}
            </div>

            {/* Input */}
            <InputArea onSendMessage={handleSendMessage} />
        </div>
    );
};

export default ChatArea;
