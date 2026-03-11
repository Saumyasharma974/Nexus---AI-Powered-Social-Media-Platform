import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Home, PlusSquare, MessageCircle, User as UserIcon,
    LogOut, Search, Loader2, Bell, Film, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { io as socketIO } from 'socket.io-client';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0); // General notifications
    const [unreadMessageCount, setUnreadMessageCount] = useState(0); // Chat messages

    const dropdownRef = useRef(null);
    const socketRef = useRef(null);

    // Fetch unread counts on mount
    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                const [notifRes, msgRes] = await Promise.all([
                    api.get('/notifications/unread-count'),
                    api.get('/messages/unread-count')
                ]);
                setUnreadCount(notifRes.data.count);
                setUnreadMessageCount(msgRes.data.count);
            } catch (err) {
                console.error('Failed to fetch unread counts', err);
            }
        };
        if (user) fetchUnreadCounts();
    }, [user]);

    // Listen for real-time notifications on socket
    useEffect(() => {
        if (!user?._id) return;
        const socket = socketIO(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            query: { userId: user._id },
        });
        socketRef.current = socket;

        socket.on('newNotification', () => {
            setUnreadCount((prev) => prev + 1);
        });

        socket.on('receiveMessage', () => {
             // Only increment if we are not on the messages page
            if (location.pathname !== '/messages') {
                 setUnreadMessageCount((prev) => prev + 1);
            }
        });

        return () => socket.disconnect();
    }, [user?._id, location.pathname]);

    // Reset counts when visiting their respective pages
    useEffect(() => {
        if (location.pathname === '/notifications') {
            setUnreadCount(0);
        }
        if (location.pathname === '/messages') {
            setUnreadMessageCount(0);
        }
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.trim().length > 0) {
                setIsSearching(true);
                setShowDropdown(true);
                try {
                    const { data } = await api.get(`/users/search?q=${searchQuery}`);
                    setSearchResults(data);
                } catch (error) {
                    console.error('Error searching users:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const isActive = (path) => location.pathname === path;

    const bottomNavItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/explore', icon: Compass, label: 'Explore' },
        { to: '/reels', icon: Film, label: 'Reels' },
        { to: '/create', icon: PlusSquare, label: 'Create' },
        { to: '/notifications', icon: Bell, label: 'Alerts', isBell: true },
        { to: '/messages', icon: MessageCircle, label: 'Chat', isChat: true },
    ];

    return (
        <>
            {/* ── TOP BAR ── */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="sticky top-0 z-50 glass border-b border-white/10 px-4 py-3"
            >
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Nexus" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-xl font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
                            Nexus
                        </span>
                    </Link>

                    {/* Right icons */}
                    <div className="flex items-center gap-5">
                        {/* Search */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown((prev) => !prev)}
                                className={`text-textSecondary hover:text-white transition-colors flex items-center ${showDropdown ? 'text-accent' : ''}`}
                            >
                                <Search size={22} />
                            </button>

                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:mt-4 sm:left-auto sm:right-0 sm:w-80 bg-bgCard/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                                    >
                                        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/20">
                                            <Search size={16} className="text-textSecondary mr-2 shrink-0" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-transparent text-white text-sm focus:outline-none w-full"
                                            />
                                            {isSearching && <Loader2 size={14} className="animate-spin text-textSecondary shrink-0" />}
                                        </div>

                                        <div className="max-h-64 overflow-y-auto">
                                            {!searchQuery ? (
                                                <p className="p-4 text-center text-sm text-textSecondary">Type to search users</p>
                                            ) : searchResults.length === 0 && !isSearching ? (
                                                <p className="p-4 text-center text-sm text-textSecondary">No users found</p>
                                            ) : (
                                                searchResults.map(resultUser => (
                                                    <div
                                                        key={resultUser._id}
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            setSearchQuery('');
                                                            navigate(`/profile/${resultUser._id}`);
                                                        }}
                                                        className="flex items-center gap-3 p-3 hover:bg-bgSecondary cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-bgSecondary flex-shrink-0 overflow-hidden">
                                                            {resultUser.profileImage ? (
                                                                <img src={resultUser.profileImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold uppercase">
                                                                    {resultUser.name?.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <h4 className="font-semibold text-sm truncate">{resultUser.name}</h4>
                                                            <p className="text-xs text-textSecondary truncate">@{resultUser.username}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile */}
                        <Link to={`/profile/${user?._id}`} className="text-textSecondary hover:text-white transition-colors">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="profile" className="w-8 h-8 rounded-full object-cover border-2 border-accent/50" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-accent/20 border-2 border-accent/50 flex items-center justify-center text-xs font-bold text-accent uppercase">
                                    {user?.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </Link>

                        {/* Logout */}
                        <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors flex items-center">
                            <LogOut size={22} />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ── BOTTOM NAV BAR ── */}
            <motion.nav
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-2 py-2 pb-safe"
            >
                <div className="max-w-md mx-auto flex items-center justify-around">
                    {bottomNavItems.map((item) => {
                        // Regular nav item (with badge for Bell)
                        const active = isActive(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${active ? 'text-accent' : 'text-textSecondary hover:text-white'}`}
                            >
                                <div className="relative">
                                    <item.icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                                    {/* Notification badge on Bell */}
                                    {item.isBell && unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </motion.span>
                                    )}
                                    {/* Message badge on Chat */}
                                    {item.isChat && unreadMessageCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
                                        >
                                            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                        </motion.span>
                                    )}
                                    {active && (
                                        <motion.div
                                            layoutId="bottomNavIndicator"
                                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full"
                                        />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${active ? 'text-accent' : ''}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </motion.nav>

            {/* Bottom padding so content doesn't hide under the nav bar */}
            <div className="h-20" />
        </>
    );
};

export default Navbar;
