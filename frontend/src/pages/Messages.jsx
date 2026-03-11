import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import CallUI from '../components/CallUI';

const Messages = () => {
    const { user } = useContext(AuthContext);
    const [conversations, setConversations] = useState([]);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]); // list of online user IDs
    const [isTyping, setIsTyping] = useState(false);    // is the other person typing?

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Connect Socket
    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:5000', {
                query: { userId: user._id },
            });
            setSocket(newSocket);
            return () => newSocket.close();
        }
    }, [user]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Online users list
        socket.on('getOnlineUsers', (userIds) => {
            setOnlineUsers(userIds);
        });

        // Receive message
        socket.on('receiveMessage', (newMessage) => {
            if (activeChatUser && newMessage.senderId === activeChatUser._id) {
                setMessages((prev) => [...prev, newMessage]);
            }
        });

        // Typing indicator — only show if the sender IS our activeChatUser
        socket.on('typing', ({ senderId }) => {
            if (activeChatUser && senderId === activeChatUser._id) {
                setIsTyping(true);
            }
        });

        socket.on('stopTyping', ({ senderId }) => {
            if (activeChatUser && senderId === activeChatUser._id) {
                setIsTyping(false);
            }
        });

        return () => {
            socket.off('getOnlineUsers');
            socket.off('receiveMessage');
            socket.off('typing');
            socket.off('stopTyping');
        };
    }, [socket, activeChatUser]);

    // Load conversations list
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingChats(true);
                const { data } = await api.get('/users/connections');
                setConversations(data);
            } catch (err) {
                console.error('Failed to load chats', err);
            } finally {
                setLoadingChats(false);
            }
        };
        if (user) fetchUsers();
    }, [user]);

    // Fetch messages for active chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeChatUser?._id) return;
            setIsTyping(false); // Reset typing on chat switch
            try {
                setLoadingMessages(true);
                const { data } = await api.get(`/messages/${activeChatUser._id}`);
                setMessages(data);
            } catch (err) {
                if (err.response?.status === 403) {
                    alert(err.response.data.message);
                    setActiveChatUser(null);
                } else {
                    console.error('Failed to load messages', err);
                }
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeChatUser]);

    // Handle typing detection with debounce
    const handleTyping = useCallback((e) => {
        setMessageText(e.target.value);

        if (!socket || !activeChatUser) return;
        socket.emit('typing', { receiverId: activeChatUser._id });

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // After 1.5s of no typing, emit stopTyping
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { receiverId: activeChatUser._id });
        }, 1500);
    }, [socket, activeChatUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChatUser) return;

        // Stop typing indicator when sending
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket?.emit('stopTyping', { receiverId: activeChatUser._id });

        try {
            const { data } = await api.post('/messages/send', {
                receiverId: activeChatUser._id,
                message: messageText,
            });
            setMessages((prev) => [...prev, data]);
            setMessageText('');
        } catch (err) {
            console.error('Failed to send message', err);
            if (err.response?.status === 403) {
                alert('Cannot message blocked user');
            }
        }
    };

    const isUserOnline = (userId) => onlineUsers.includes(userId);

    return (
        <div className="max-w-6xl mx-auto pt-4 pb-24 px-4 h-[calc(100vh-144px)] md:pb-8">
            <div className="glass rounded-2xl flex border border-white/10 h-full overflow-hidden shadow-2xl">

                {/* ─── Sidebar ─── */}
                <div className={`w-full md:w-1/3 border-r border-white/10 flex-col bg-bgSecondary/30 ${activeChatUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-xl font-bold">Messages</h2>
                        <p className="text-xs text-textSecondary mt-1">{onlineUsers.length - 1 > 0 ? `${onlineUsers.length - 1} online` : 'No one online'}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                        {loadingChats ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-textSecondary" /></div>
                        ) : conversations.length === 0 ? (
                            <p className="text-center p-8 text-textSecondary text-sm">Follow users to start chatting!</p>
                        ) : (
                            conversations.map((c) => {
                                const online = isUserOnline(c._id);
                                return (
                                    <div
                                        key={c._id}
                                        onClick={() => setActiveChatUser(c)}
                                        className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-white/5 ${activeChatUser?._id === c._id
                                            ? 'bg-accent/20 border-l-4 border-l-accent'
                                            : 'hover:bg-bgSecondary'
                                            }`}
                                    >
                                        {/* Avatar with online dot */}
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-bgCard border border-white/10">
                                                {c.profileImage ? (
                                                    <img src={c.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-lg uppercase font-bold text-indigo-300">
                                                        {c.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online / Offline dot */}
                                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bgSecondary ${online ? 'bg-green-400' : 'bg-gray-500'}`} />
                                        </div>

                                        <div className="overflow-hidden flex-1">
                                            <h4 className="font-semibold truncate">{c.name}</h4>
                                            <p className={`text-xs truncate ${online ? 'text-green-400' : 'text-textSecondary'}`}>
                                                {online ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ─── Chat Window ─── */}
                <div className={`flex-1 flex-col bg-bgMain/40 relative ${!activeChatUser ? 'hidden md:flex' : 'flex'}`}>
                    <CallUI socket={socket} activeChatUser={activeChatUser} user={user} />

                    {activeChatUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 bg-bgSecondary/50 flex items-center gap-3 shrink-0">
                                <button 
                                    onClick={() => setActiveChatUser(null)} 
                                    className="md:hidden text-zinc-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bgCard">
                                        {activeChatUser.profileImage ? (
                                            <img src={activeChatUser.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-lg uppercase font-bold text-indigo-300">
                                                {activeChatUser?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online dot on header avatar */}
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bgSecondary ${isUserOnline(activeChatUser._id) ? 'bg-green-400' : 'bg-gray-500'}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold">{activeChatUser?.name || 'Unknown User'}</h3>
                                    <p className={`text-xs ${isUserOnline(activeChatUser._id) ? 'text-green-400' : 'text-textSecondary'}`}>
                                        {isTyping ? '✍️ typing...' : isUserOnline(activeChatUser._id) ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {loadingMessages ? (
                                    <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin text-textSecondary" size={32} /></div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-textSecondary">
                                        <p>No messages yet.</p>
                                        <p className="text-sm">Say hello to {activeChatUser?.name}!</p>
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isMe = m.senderId === user._id;
                                        return (
                                            <div key={m._id || `${m.senderId}-${m.createdAt}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl p-3 px-4 shadow-md ${isMe
                                                    ? 'bg-accent text-white rounded-br-sm'
                                                    : 'bg-bgSecondary border border-white/10 rounded-bl-sm'
                                                    }`}>
                                                    <p className="text-sm md:text-base break-words">{m.message}</p>
                                                    <span className="text-[10px] opacity-60 mt-1 block text-right">
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* Typing indicator bubble */}
                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-bgSecondary border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-textSecondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-white/10 bg-bgSecondary/20 shrink-0">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={handleTyping}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-bgMain border border-white/10 rounded-full px-5 py-3 focus:outline-none focus:border-accent text-sm text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageText.trim()}
                                        className="bg-accent hover:bg-indigo-400 text-white p-3 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
                                    >
                                        <Send size={20} className="ml-1" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-textSecondary p-8 h-full">
                            <div className="w-24 h-24 bg-bgSecondary rounded-full flex items-center justify-center mb-6">
                                <Send size={40} className="opacity-50 ml-2" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Your Messages</h3>
                            <p>Select a conversation from the sidebar to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
