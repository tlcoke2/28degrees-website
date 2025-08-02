import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  TextField, 
  Typography, 
  Avatar, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider,
  Fade,
  CircularProgress,
  Tooltip,
  Collapse
} from '@mui/material';
import { 
  Send as SendIcon, 
  Close as CloseIcon, 
  SmartToy as AIIcon,
  Person as UserIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

// Mock AI responses
const mockResponses = [
  "I can help you with booking events, checking availability, and answering questions about our services.",
  "To book an event, simply go to the event page and click the 'Book Now' button. Follow the steps to complete your booking.",
  "Our cancellation policy allows for a full refund up to 7 days before the event. After that, a 50% fee may apply.",
  "You can check your booking status by logging into your account and visiting the 'My Bookings' section.",
  "We accept all major credit cards, PayPal, and bank transfers for payments.",
  "For any urgent inquiries, please contact our support team at support@28degreeswest.com or call +1 (555) 123-4567.",
];

const AIAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initial welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: "Hello! I'm your 28 Degrees assistant. How can I help you today?",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    }
  }, [open]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response after a delay
    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    // Auto-submit after a short delay to show the typing indicator
    setTimeout(() => {
      const form = document.createElement('form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }, 100);
  };

  const suggestedQuestions = [
    "How do I book an event?",
    "What's your cancellation policy?",
    "How can I contact support?"
  ];

  return (
    <>
      {!open && (
        <Tooltip title="Need help? Ask our AI assistant">
          <HelpButton 
            color="primary" 
            onClick={handleOpen}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isHovered ? <HelpIcon /> : <AIIcon />}
          </HelpButton>
        </Tooltip>
      )}

      <Fade in={open}>
        <StyledPaper 
          elevation={3}
          sx={{ 
            transform: minimized ? 'translateY(calc(100% - 48px))' : 'none',
            transition: 'transform 0.3s ease-in-out',
            bottom: minimized ? '0' : '16px',
            maxHeight: minimized ? '48px' : '70vh',
            overflow: 'hidden',
            '&:hover': {
              transform: minimized ? 'translateY(calc(100% - 56px))' : 'none',
            }
          }}
        >
          <Header 
            onClick={toggleMinimize}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.primary.dark,
              },
              transition: 'background-color 0.2s ease-in-out',
            }}
          >
            <AIIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              AI Assistant {minimized ? '(Minimized)' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={minimized ? 'Maximize' : 'Minimize'}>
                <IconButton 
                  size="small" 
                  color="inherit"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize();
                  }}
                >
                  {minimized ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton 
                  size="small" 
                  color="inherit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Header>
          
          <Collapse in={!minimized} timeout="auto" unmountOnExit>
            <MessagesContainer>
              {messages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItem 
                    alignItems="flex-start" 
                    sx={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      textAlign: message.sender === 'user' ? 'right' : 'left',
                      pl: message.sender === 'ai' ? 0 : 4,
                      pr: message.sender === 'user' ? 0 : 4,
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: '40px' }}>
                      {message.sender === 'ai' ? (
                        <StyledAvatar sx={{ bgcolor: 'primary.main' }}>
                          <AIIcon />
                        </StyledAvatar>
                      ) : (
                        <StyledAvatar sx={{ bgcolor: 'grey.500' }}>
                          <UserIcon />
                        </StyledAvatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Paper
                          elevation={0}
                          sx={{
                            display: 'inline-block',
                            p: 1.5,
                            borderRadius: message.sender === 'ai' 
                              ? '0 16px 16px 16px' 
                              : '16px 0 16px 16px',
                            backgroundColor: message.sender === 'ai' 
                              ? 'action.hover' 
                              : 'primary.main',
                            color: message.sender === 'ai' 
                              ? 'text.primary' 
                              : 'primary.contrastText',
                            maxWidth: '80%',
                            wordBreak: 'break-word',
                            textAlign: 'left',
                          }}
                        >
                          {message.text}
                        </Paper>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            textAlign: message.sender === 'user' ? 'right' : 'left',
                          }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      }
                      secondaryTypographyProps={{
                        component: 'div',
                      }}
                      sx={{ m: 0 }}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" sx={{ my: 1 }} />
                </React.Fragment>
              ))}
              
              {isTyping && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, pl: 6 }}>
                  <CircularProgress size={20} sx={{ mr: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Typing...
                  </Typography>
                </Box>
              )}
              
              {messages.length <= 1 && (
                <Box sx={{ mt: 2, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Try asking me:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {suggestedQuestions.map((question, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        onClick={() => handleQuickQuestion(question)}
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <Typography variant="caption">
                          {question}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </MessagesContainer>
            
            <form onSubmit={handleSubmit}>
              <InputContainer>
                <StyledTextField
                  placeholder="Type your message..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={input}
                  onChange={handleInputChange}
                  autoComplete="off"
                  disabled={isTyping}
                />
                <IconButton 
                  color="primary" 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  sx={{ ml: 1 }}
                  aria-label="Send message"
                >
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
