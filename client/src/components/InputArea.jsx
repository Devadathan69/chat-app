import { useState, useRef } from 'react';
import { FaPaperPlane, FaPaperclip, FaCode, FaTimes, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const InputArea = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [isCodeMode, setIsCodeMode] = useState(false);
    const [codeLanguage, setCodeLanguage] = useState('javascript');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if (!message.trim()) return;

        if (isCodeMode) {
            onSendMessage({ type: 'code', content: message, language: codeLanguage });
            setIsCodeMode(false);
        } else {
            onSendMessage({ type: 'text', content: message });
        }
        setMessage('');
        setShowEmojiPicker(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isCodeMode) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onSendMessage({
                    type: 'file',
                    content: reader.result,
                    fileName: file.name
                });
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = null;
    };

    const onEmojiClick = (emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji);
    };

    return (
        <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            borderTop: 'var(--glass-border)',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative'
        }}>
            {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 10 }}>
                    <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme="dark"
                        searchDisabled={true} // Simplify for now
                        width="300px"
                        height="350px"
                    />
                </div>
            )}

            {isCodeMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>Code Mode</span>
                    <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: 'none', padding: '5px', borderRadius: '4px', color: 'white' }}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="sql">SQL</option>
                    </select>
                    <button onClick={() => setIsCodeMode(false)} className="btn-icon" style={{ marginLeft: 'auto' }}>
                        <FaTimes />
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                <button
                    className="btn-icon"
                    title="Attach File"
                    onClick={() => fileInputRef.current.click()}
                >
                    <FaPaperclip />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />

                <button
                    className="btn-icon"
                    title="Code Snippet"
                    onClick={() => setIsCodeMode(!isCodeMode)}
                    style={{ color: isCodeMode ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                    <FaCode />
                </button>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isCodeMode ? "Paste your code here..." : "Type a message..."}
                    style={{
                        flex: 1,
                        resize: 'none',
                        minHeight: '45px',
                        maxHeight: '150px',
                        fontFamily: isCodeMode ? 'monospace' : 'inherit'
                    }}
                    rows={isCodeMode ? 5 : 1}
                />

                <button
                    className="btn-icon"
                    title="Emoji"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ color: showEmojiPicker ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                    <FaSmile />
                </button>

                <button className="btn btn-primary" onClick={handleSend} style={{ borderRadius: '50%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );
};

export default InputArea;
