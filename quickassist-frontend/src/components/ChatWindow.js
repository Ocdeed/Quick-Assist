// In src/components/ChatWindow.js
import React, { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Box, TextField, Button, Paper, List, ListItem, ListItemText, Typography } from '@mui/material';

const ChatWindow = ({ bookingId }) => {
    const [messageHistory, setMessageHistory] = useState([]);
    const [message, setMessage] = useState('');
    const chatSocketUrl = `ws://127.0.0.1:8000/ws/chat/${bookingId}/`;

    const { sendMessage, lastMessage, readyState } = useWebSocket(chatSocketUrl, {
        shouldReconnect: (closeEvent) => true,
    });
    
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (lastMessage !== null) {
            const data = JSON.parse(lastMessage.data);
            setMessageHistory((prev) => [...prev, data]);
        }
    }, [lastMessage]);
    
    useEffect(() => {
        // Scroll to bottom on new message
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messageHistory]);


    const handleSendMessage = () => {
        if (message.trim()) {
            sendMessage(JSON.stringify({ message }));
            setMessage('');
        }
    };

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    return (
        <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box p={2} sx={{ borderBottom: '1px solid #ddd' }}>
                <Typography variant="h6">Chat</Typography>
                <Typography variant="caption">Status: {connectionStatus}</Typography>
            </Box>
            <List ref={chatBoxRef} sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messageHistory.map((msg, idx) => (
                    <ListItem key={idx}>
                        <ListItemText primary={msg.message} secondary={`${msg.sender} - ${new Date(msg.timestamp).toLocaleTimeString()}`} />
                    </ListItem>
                ))}
            </List>
            <Box p={2} sx={{ display: 'flex', gap: 1, borderTop: '1px solid #ddd' }}>
                <TextField 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="contained" onClick={handleSendMessage}>Send</Button>
            </Box>
        </Paper>
    );
};

export default ChatWindow;