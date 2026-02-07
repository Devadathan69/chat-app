
import { useState } from 'react';
import { FaGlobe, FaPlus, FaCircle, FaLock, FaKey, FaTimesCircle } from 'react-icons/fa';

const Sidebar = ({
    activeTab, setActiveTab,
    rooms, onlineUsers,
    currentRoom, onJoinRoom, onJoinPrivateRoom, onCreateRoom, onCloseRoom, onStartPrivate,
    currentUser, privateChats
}) => {
    const [newRoomName, setNewRoomName] = useState('');
    const [roomType, setRoomType] = useState('public');
    const [isCreating, setIsCreating] = useState(false);

    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (newRoomName.trim()) {
            onCreateRoom(newRoomName.trim(), roomType);
            setNewRoomName('');
            setIsCreating(false);
            setRoomType('public');
        }
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (joinCode.trim()) {
            onJoinPrivateRoom(joinCode.trim());
            setJoinCode('');
            setIsJoining(false);
        }
    };

    return (
        <div className="glass-panel" style={{
            width: '300px',
            height: '100%', // Ensure it takes full height of wrapper
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            flexShrink: 0
        }}>
            <div style={{ display: 'flex', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '5px' }}>
                <button
                    onClick={() => setActiveTab('rooms')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: activeTab === 'rooms' ? 'var(--primary-gradient)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: activeTab === 'rooms' ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}>
                    Rooms
                </button>
                <button
                    onClick={() => setActiveTab('online')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: activeTab === 'online' ? 'var(--primary-gradient)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: activeTab === 'online' ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}>
                    Online ({onlineUsers.length})
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'rooms' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                        {/* Global Room */}
                        <div
                            onClick={() => onJoinRoom('general')}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: currentRoom.id === 'general' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                border: currentRoom.id === 'general' ? '1px solid var(--accent-color)' : '1px solid transparent'
                            }}
                        >
                            <FaGlobe color={currentRoom.id === 'general' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                            <div style={{ flex: 1, fontWeight: 'bold' }}>Global Room</div>
                        </div>

                        {/* Actions Area */}
                        {!isCreating && !isJoining && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px dashed rgba(255,255,255,0.3)',
                                        color: 'var(--text-secondary)',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <FaPlus size={12} /> Create
                                </button>
                                <button
                                    onClick={() => setIsJoining(true)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px dashed rgba(255,255,255,0.3)',
                                        color: 'var(--text-secondary)',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <FaKey size={12} /> Join Private
                                </button>
                            </div>
                        )}

                        {isCreating && (
                            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Create Room</span>
                                    <FaTimesCircle onClick={() => setIsCreating(false)} style={{ cursor: 'pointer' }} />
                                </div>
                                <input
                                    autoFocus
                                    placeholder="Room Name"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                />
                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input type="radio" name="type" checked={roomType === 'public'} onChange={() => setRoomType('public')} /> Public
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input type="radio" name="type" checked={roomType === 'private'} onChange={() => setRoomType('private')} /> Private
                                    </label>
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '8px', fontSize: '0.9rem' }}>Create</button>
                            </form>
                        )}

                        {isJoining && (
                            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Join Private</span>
                                    <FaTimesCircle onClick={() => setIsJoining(false)} style={{ cursor: 'pointer' }} />
                                </div>
                                <input
                                    autoFocus
                                    placeholder="Room Code (Name)"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                />
                                <button type="submit" className="btn-primary" style={{ padding: '8px', fontSize: '0.9rem' }}>Join</button>
                            </form>
                        )}

                        {/* Current Room Close Logic */}
                        {currentRoom.creator === currentUser.id && currentRoom.id !== 'general' && (
                            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <button onClick={onCloseRoom} className="btn" style={{ background: 'rgba(255,50,50,0.2)', color: '#ff6b6b', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <FaTimesCircle /> Close Current Room
                                </button>
                            </div>
                        )}

                        {/* Public List */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Public Rooms</div>
                        {rooms.filter(r => r.id !== 'general').map(room => (
                            <div
                                key={room.id}
                                onClick={() => onJoinRoom(room.id)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: currentRoom.id === room.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    border: currentRoom.id === room.id ? '1px solid var(--accent-color)' : '1px solid transparent'
                                }}
                            >
                                {room.type === 'private' ? (
                                    <FaLock color={currentRoom.id === room.id ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                                ) : (
                                    <FaGlobe color={currentRoom.id === room.id ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{String(room.name)}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{room.userCount} users</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {onlineUsers.filter(u => u.id !== currentUser.id).map(user => (
                            <div
                                key={user.id}
                                onClick={() => onStartPrivate(user)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: currentRoom.id === user.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    border: currentRoom.id === user.id ? '1px solid var(--accent-color)' : '1px solid transparent'
                                }}
                            >
                                <div style={{
                                    width: '35px', height: '35px', borderRadius: '50%',
                                    background: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', color: 'black'
                                }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#00fa9a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <FaCircle size={8} /> Online
                                    </div>
                                </div>
                                {privateChats[user.id]?.unread > 0 && (
                                    <div style={{
                                        background: 'red', borderRadius: '50%', width: '20px', height: '20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
                                    }}>
                                        {privateChats[user.id].unread}
                                    </div>
                                )}
                            </div>
                        ))}
                        {onlineUsers.length <= 1 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
                                No other users online.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Logged in as:</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{onlineUsers.find(u => u.id === currentUser.id)?.username || 'Me'}</div>
            </div>
        </div>
    );
};

export default Sidebar;
