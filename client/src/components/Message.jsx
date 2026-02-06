import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaFileDownload, FaCode } from 'react-icons/fa';

const Message = ({ msg, isMe }) => {
    if (msg.type === 'system') {
        return (
            <div style={{
                textAlign: 'center',
                margin: '10px 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                opacity: 0.7
            }}>
                {msg.content}
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
            margin: '10px 0',
            maxWidth: '100%'
        }}>
            <div style={{
                fontSize: '0.75rem',
                marginBottom: '4px',
                marginLeft: '8px',
                marginRight: '8px',
                color: 'var(--text-secondary)'
            }}>
                {isMe ? 'You' : msg.sender}
            </div>

            <div style={{
                background: isMe ? 'var(--msg-me)' : 'var(--msg-other)',
                padding: msg.type === 'code' ? '0' : '10px 15px',
                borderRadius: '12px',
                borderTopRightRadius: isMe ? '2px' : '12px',
                borderTopLeftRadius: isMe ? '12px' : '2px',
                maxWidth: '75%',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                color: 'white',
                overflow: 'hidden' // For code blocks
            }}>
                {msg.type === 'text' && (
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                    </div>
                )}

                {msg.type === 'code' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '5px 10px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: '#e0e0e0'
                        }}>
                            <FaCode /> {msg.language || 'Code'}
                        </div>
                        <SyntaxHighlighter
                            language={msg.language || 'javascript'}
                            style={vscDarkPlus}
                            customStyle={{ margin: 0, padding: '15px', borderRadius: 0, fontSize: '0.9rem' }}
                        >
                            {msg.content}
                        </SyntaxHighlighter>
                    </div>
                )}

                {msg.type === 'file' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {msg.fileName && (msg.fileName.match(/\.(jpg|jpeg|png|gif)$/i)) ? (
                            <img
                                src={msg.content}
                                alt="Shared file"
                                style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px' }}
                            />
                        ) : (
                            <a
                                href={msg.content}
                                download={msg.fileName || 'download'}
                                style={{
                                    color: 'white', textDecoration: 'none', display: 'flex',
                                    alignItems: 'center', gap: '8px', fontWeight: 'bold'
                                }}
                            >
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)', padding: '10px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <FaFileDownload />
                                </div>
                                {msg.fileName || 'Download File'}
                            </a>
                        )}
                    </div>
                )}
            </div>

            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
};

export default Message;
