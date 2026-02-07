import { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import Login from './components/Login';
import Layout from './components/Layout';
import './index.css';

// Initialize socket connection
const SOCKET_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : (import.meta.env.VITE_SERVER_URL || "https://chat-app-ydcu.onrender.com");
const socket = io(SOCKET_URL);

function App() {
  const [username, setUsername] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (username) {
        console.log("Reconnecting user:", username);
        socket.emit('joinApp', username);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [username]);

  const handleLogin = (name) => {
    setUsername(name);
    socket.emit('joinApp', name);
  };

  return (
    <>
      {!username ? (
        <Login onJoin={handleLogin} />
      ) : (
        <Layout socket={socket} username={username} />
      )}
    </>
  );
}

export default App;
