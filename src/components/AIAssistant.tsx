// src/components/AIAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box, IconButton, Paper, TextField, Typography, Avatar, ListItem,
  ListItemAvatar, ListItemText, Divider, Fade, CircularProgress, Tooltip,
  Collapse
} from '@mui/material';
import {
  Send as SendIcon, Close as CloseIcon, SmartToy as AIIcon,
  Person as UserIcon, HelpOutline as HelpIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/UserContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  width: '360px',
  maxWidth: '90vw',
  maxHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1300,
  boxShadow: theme.shadows[10],
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  cursor: 'pointer',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1.5, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

const StyledTextField = styled(TextField)({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    backgroundColor: 'white',
  },
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(4),
  height: theme.spacing(4),
  marginRight: theme.spacing(1.5),
}));

const HelpButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  width: '60px',
  height: '60px',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  zIndex: 1300,
  boxShadow: theme.shadows[10],
}));

function getApiBase(): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
  if (!base) throw new Error('API base URL is not configured (VITE_API_BASE_URL).');
  return String(base).replace(/\/+$/, '');
}

function buildHistory(messages: Message[]) {
  // Compact chat history for fallback completion endpoint
  return messages
    .filter(m => m.text && (m.sender === 'user' || m.sender === 'ai'))
    .map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));
}

const AIAssistant: React.FC = () => {
  const { /* user, */ } = useAuth();
  const token = localStorage.getItem('token') || '';
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Load initial welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        { id: '1', text: "Hello! I'm your 28 Degrees assistant. How can I help you today?", sender: 'ai', timestamp: new Date() },
      ]);
    }
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fallbackComplete = async (text: string) => {
    // Non-streaming fallback to /api/v1/ai/chat
    try {
      const base = getApiBase();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const authToken =
        (typeof window !== 'undefined' && (localStorage.getItem('adminToken') || localStorage.getItem('token'))) ||
        token ||
        '';

      const res = await fetch(`${base}/api/v1/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: buildHistory(messages),
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Fallback AI error: ${res.status} ${msg}`);
      }
      const data = await res.json();
      // Expecting shape: { data: { text: string } } or { text: string }
      const reply = data?.data?.text || data?.text || data?.message || 'Sorry, I could not get a response.';
      return String(reply);
    } catch (err: any) {
      return `⚠️ AI service unavailable. ${err?.message || 'Please try again later.'}`;
    }
  };

  const sendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // 1) Try SSE streaming first
    let usedFallback = false;
    try {
      const base = getApiBase();
      const url = `${base}/api/v1/ai/chat/stream?message=${encodeURIComponent(text)}`;

      const eventSource = new EventSource(url, { withCredentials: true });
      let aiText = '';
      const aiMessageId = (Date.now() + 1).toString();

      const closeTyping = () => setIsTyping(false);

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          closeTyping();
          return;
        }
        aiText += event.data;
        setMessages(prev => {
          const exists = prev.find(m => m.id === aiMessageId);
          if (exists) {
            return prev.map(m => (m.id === aiMessageId ? { ...m, text: aiText } : m));
          }
          return [...prev, { id: aiMessageId, text: aiText, sender: 'ai', timestamp: new Date() }];
        });
      };

      eventSource.onerror = async () => {
        // SSE failed → fallback to non-streaming
        eventSource.close();
        usedFallback = true;
        const reply = await fallbackComplete(text);
        setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), text: reply, sender: 'ai', timestamp: new Date() }]);
        setIsTyping(false);
      };
    } catch {
      // 2) If SSE setup itself threw, fallback
      const reply = await fallbackComplete(text);
      setMessages(prev => [...prev, { id: (Date.now() + 3).toString(), text: reply, sender: 'ai', timestamp: new Date() }]);
      setIsTyping(false);
    } finally {
      // Safety: if neither SSE nor fallback resolved (very rare), stop spinner
      setTimeout(() => {
        if (isTyping && !usedFallback) setIsTyping(false);
      }, 30000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input.trim());
  };

  return (
    <>
      {!open && (
        <Tooltip title="Need help? Ask our AI assistant">
          <HelpButton
            onClick={() => { setOpen(true); setMinimized(false); }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isHovered ? <HelpIcon /> : <AIIcon />}
          </HelpButton>
        </Tooltip>
      )}

      <Fade in={open}>
        <StyledPaper
          sx={{
            transform: minimized ? 'translateY(calc(100% - 48px))' : 'none',
            transition: 'transform 0.3s ease-in-out',
            bottom: minimized ? '0' : '16px',
            maxHeight: minimized ? '48px' : '70vh',
          }}
        >
          <Header onClick={() => setMinimized(!minimized)}>
            <AIIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              AI Assistant {minimized ? '(Minimized)' : ''}
            </Typography>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Header>

          <Collapse in={!minimized}>
            <MessagesContainer>
              {messages.map((m) => (
                <React.Fragment key={m.id}>
                  <ListItem sx={{ flexDirection: m.sender === 'user' ? 'row-reverse' : 'row' }}>
                    <ListItemAvatar>
                      <StyledAvatar sx={{ bgcolor: m.sender === 'ai' ? 'primary.main' : 'grey.500' }}>
                        {m.sender === 'ai' ? <AIIcon /> : <UserIcon />}
                      </StyledAvatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Paper sx={{
                          p: 1.5,
                          borderRadius: m.sender === 'ai' ? '0 16px 16px 16px' : '16px 0 16px 16px',
                          bgcolor: m.sender === 'ai' ? 'action.hover' : 'primary.main',
                          color: m.sender === 'ai' ? 'text.primary' : 'primary.contrastText',
                        }}>
                          {m.text}
                        </Paper>
                      }
                      secondary={<Typography variant="caption">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>}
                    />
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              ))}
              {isTyping && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, pl: 6 }}>
                  <CircularProgress size={20} sx={{ mr: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">Typing...</Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <form onSubmit={handleSubmit}>
              <InputContainer>
                <StyledTextField
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <IconButton type="submit" disabled={!input.trim() || isTyping}>
                  <SendIcon />
                </IconButton>
              </InputContainer>
            </form>
          </Collapse>
        </StyledPaper>
      </Fade>
    </>
  );
};

export default AIAssistant;
