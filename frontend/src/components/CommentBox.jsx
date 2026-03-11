import { useState } from 'react';
import api from '../services/api';
import { Send } from 'lucide-react';

const CommentBox = ({ postId, onCommentAdded }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            setLoading(true);
            const { data } = await api.post('/posts/comment', { postId, text });
            setText('');
            if (onCommentAdded) {
                onCommentAdded(data);
            }
        } catch (err) {
            console.error('Failed to add comment', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col mt-4">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-bgSecondary border border-white/10 rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="p-2 text-accent hover:text-indigo-400 disabled:opacity-50 transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
        </form>
    );
};

export default CommentBox;
