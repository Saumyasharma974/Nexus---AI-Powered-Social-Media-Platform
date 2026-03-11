import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('password'); // 'password' or 'blocked'
    
    // Password state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    // Blocked users state
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedLoading, setBlockedLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'blocked') {
            fetchBlockedUsers();
        }
    }, [activeTab]);

    const fetchBlockedUsers = async () => {
        try {
            setBlockedLoading(true);
            const { data } = await api.get('/users/blocked');
            setBlockedUsers(data);
        } catch (error) {
            console.error("Failed to fetch blocked users", error);
        } finally {
            setBlockedLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');
        if (newPassword.length < 6) return setPassError('New password must be at least 6 characters');
        
        try {
            setPassLoading(true);
            await api.put('/users/password', { oldPassword, newPassword });
            setPassSuccess('Password updated successfully!');
            setOldPassword('');
            setNewPassword('');
        } catch (error) {
            setPassError(error.response?.data?.message || 'Failed to update password');
        } finally {
            setPassLoading(false);
        }
    };

    const handleUnblock = async (userId) => {
        try {
            await api.post(`/users/unblock/${userId}`);
            setBlockedUsers(blockedUsers.filter(u => u._id !== userId));
        } catch (error) {
            console.error("Failed to unblock user", error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pt-8 pb-32 px-4">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 bg-bgSecondary hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold">Settings</h2>
            </div>
            
            <div className="glass rounded-xl overflow-hidden border border-white/10">
                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'password' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Lock size={18} /> Password
                    </button>
                    <button 
                        onClick={() => setActiveTab('blocked')}
                        className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'blocked' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShieldAlert size={18} /> Blocked Users
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {/* PASSWORD TAB */}
                    {activeTab === 'password' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h3 className="text-lg font-bold mb-4">Change Password</h3>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                {passError && <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm">{passError}</div>}
                                {passSuccess && <div className="p-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm">{passSuccess}</div>}
                                
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">Current Password</label>
                                    <input 
                                        type="password" 
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent font-medium transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">New Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent font-medium transition-colors"
                                        minLength={6}
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={passLoading}
                                    className="w-full py-3 bg-accent hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                                >
                                    {passLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                                    Update Password
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* BLOCKED USERS TAB */}
                    {activeTab === 'blocked' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h3 className="text-lg font-bold mb-4">Manage Blocked Users</h3>
                            
                            {blockedLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={32} /></div>
                            ) : blockedUsers.length === 0 ? (
                                <div className="text-center text-textSecondary py-10 bg-black/20 rounded-xl">
                                    You haven't blocked anyone yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {blockedUsers.map(user => (
                                        <div key={user._id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                            <Link to={`/profile/${user._id}`} className="flex items-center gap-3">
                                                <img 
                                                    src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}`} 
                                                    className="w-10 h-10 rounded-full object-cover" 
                                                />
                                                <div>
                                                    <div className="font-bold text-sm text-white">{user.name}</div>
                                                    <div className="text-xs text-textSecondary">@{user.username}</div>
                                                </div>
                                            </Link>
                                            <button 
                                                onClick={() => handleUnblock(user._id)}
                                                className="px-4 py-2 bg-textSecondary/20 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
