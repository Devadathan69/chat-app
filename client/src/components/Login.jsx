import { useState } from 'react';

const Login = ({ onJoin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin(name.trim());
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
        }}>
            <div className="glass-panel" style={{
                padding: '40px',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <h1 style={{ marginBottom: '10px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem' }}>Gabble</h1>
                <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>Enter your alias to join the wave.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="Display Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                        Enter Chat
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
