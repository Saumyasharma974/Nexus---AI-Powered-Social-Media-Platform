import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Check, CheckCheck, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const iconMap = {
    like: <Heart size={16} className="text-red-400" />,
    comment: <MessageCircle size={16} className="text-indigo-400" />,
    follow: <UserPlus size={16} className="text-green-400" />,
};

const bgMap = {
    like: 'bg-red-500/10 border-red-500/20',
    comment: 'bg-indigo-500/10 border-indigo-500/20',
    follow: 'bg-green-500/10 border-green-500/20',
};

const Notifications = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        } finally {
            setMarkingAll(false);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.read) handleMarkAsRead(notif._id);

        if (notif.type === 'follow') {
            navigate(`/profile/${notif.sender._id}`);
        } else if (notif.post) {
            navigate('/'); // Could navigate to specific post later
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
                    >
                        {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        Mark all read
                    </motion.button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                </div>
            ) : notifications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-4"
                >
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Bell size={36} className="text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 text-center">No notifications yet.<br />When someone likes or follows you, it'll show here.</p>
                </motion.div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {notifications.map((notif, i) => (
                            <motion.div
                                key={notif._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => handleNotificationClick(notif)}
                                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${notif.read
                                        ? 'bg-white/3 border-white/5 hover:border-white/15'
                                        : `${bgMap[notif.type]} hover:brightness-110`
                                    }`}
                            >
                                {/* Sender Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-500/20">
                                        {notif.sender?.profileImage ? (
                                            <img src={notif.sender.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-indigo-300 uppercase">
                                                {notif.sender?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    {/* Type icon badge */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0f0f18] rounded-full flex items-center justify-center border border-white/10">
                                        {iconMap[notif.type]}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug ${notif.read ? 'text-zinc-400' : 'text-white'}`}>
                                        <span className="font-semibold">{notif.sender?.name}</span>{' '}
                                        {notif.type === 'like' && 'liked your post'}
                                        {notif.type === 'comment' && `commented: "${notif.message?.split(': ')[1] || ''}"`}
                                        {notif.type === 'follow' && 'started following you'}
                                    </p>
                                    <p className="text-xs text-zinc-600 mt-1">{timeAgo(notif.createdAt)}</p>
                                </div>

                                {/* Post thumbnail */}
                                {notif.post?.image && (
                                    <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                                        <img src={notif.post.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Unread dot */}
                                {!notif.read && (
                                    <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-400 mt-1" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Notifications;
