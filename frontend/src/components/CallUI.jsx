import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video as VideoIcon, Mic, MicOff, PhoneOff, VideoOff, Camera } from 'lucide-react';

const CallUI = ({ socket, activeChatUser, user }) => {
    const [callState, setCallState] = useState('idle'); // idle, ringing, calling, connected
    const [receivingCall, setReceivingCall] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null); // { from, name, signal, isVideo, fromSocket }
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const [micEnabled, setMicEnabled] = useState(true);
    const [camEnabled, setCamEnabled] = useState(true);

    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const connectionRef = useRef(null);
    const streamRef = useRef(null);
    const iceQueueRef = useRef([]);

    // Initialize WebRTC and listen for signaling
    useEffect(() => {
        if (!socket) return;

        const handleCallUser = ({ from, name, signal, isVideoCall, fromSocket }) => {
            if (signal.type === 'offer') {
                setReceivingCall(true);
                setCallerInfo({ from, name, signal, isVideoCall, fromSocket });
            } else if (signal.type === 'candidate') {
                if (connectionRef.current && connectionRef.current.remoteDescription) {
                    connectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(console.error);
                } else {
                    iceQueueRef.current.push(signal.candidate);
                }
            }
        };

        const handleCallAccepted = async (signal) => {
            console.log("☎️ Received answers/candidates from receiver:", signal.type);

            if (signal.type === 'answer') {
                console.log("☎️ Setting Remote Description (Answer) for Caller!");
                setCallState('connected');
                if (connectionRef.current) {
                    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                    console.log("☎️ Remote Description Set Successfully. Flushing ICE Queue. Queue size:", iceQueueRef.current.length);
                    // Add any queued candidates now that remote description is set
                    iceQueueRef.current.forEach(c => connectionRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(console.error));
                    iceQueueRef.current = [];
                } else {
                    console.error("☎️ ERROR: Caller received Answer but connectionRef is missing!");
                }
            } else if (signal.type === 'candidate') {
                if (connectionRef.current && connectionRef.current.remoteDescription) {
                    console.log("☎️ Adding ICE candidate to live Caller connection");
                    connectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(console.error);
                } else {
                    console.log("☎️ Queuing ICE candidate for Caller (Waiting for Answer)");
                    iceQueueRef.current.push(signal.candidate);
                }
            }
        };

        const handleCallEnded = () => {
            console.log("☎️ Call Ended from remote");
            endCallLocally();
        };

        socket.on('callUser', handleCallUser);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callEnded', handleCallEnded);

        return () => {
            socket.off('callUser', handleCallUser);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
        };
    }, [socket]);

    // Timer logic
    useEffect(() => {
        let interval;
        if (callState === 'connected') {
            interval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [callState]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getMediaStream = async (video) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
            streamRef.current = stream;

            // Wait for React to render the <video> element
            setTimeout(() => {
                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
            }, 100);

            return stream;
        } catch (err) {
            console.error("Failed to get local stream", err);
            return null;
        }
    };

    // Global cleanup for streams on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // ─── START A CALL ───
    const initiateCall = async (video) => {
        if (!activeChatUser) return;
        setIsVideoCall(video);
        setCallState('calling');
        iceQueueRef.current = [];

        const stream = await getMediaStream(video);
        if (!stream) return endCallLocally();

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
            ]
        });

        connectionRef.current = peer;

        // Add our tracks
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // When we get remote tracks
        peer.ontrack = (event) => {
            if (userVideo.current && event.streams[0]) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        // Emit ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('callUser', {
                    userToCall: activeChatUser._id,
                    signalData: { type: 'candidate', candidate: event.candidate },
                    from: user._id,
                    name: user.name,
                    isVideoCall: video
                });
            }
        };

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit('callUser', {
                userToCall: activeChatUser._id,
                signalData: offer,
                from: user._id,
                name: user.name,
                isVideoCall: video,
                fromSocket: socket.id
            });
        } catch (err) {
            console.error(err);
        }
    };

    // ─── ACCEPT A CALL ───
    const acceptCall = async () => {
        setReceivingCall(false);
        setIsVideoCall(callerInfo.isVideoCall);
        setCallState('connected');
        // Do NOT clear iceQueueRef.current here; we process it after setting RemoteDescription

        const stream = await getMediaStream(callerInfo.isVideoCall);
        if (!stream) return endCallLocally();

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
            ]
        });

        connectionRef.current = peer;

        // Add tracks
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // Receive remote tracks
        peer.ontrack = (event) => {
            if (userVideo.current && event.streams[0]) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('answerCall', { to: callerInfo.from, signal: { type: 'candidate', candidate: event.candidate } });
            }
        };

        // Set remote description from offer
        if (callerInfo.signal && callerInfo.signal.type === 'offer') {
            await peer.setRemoteDescription(new RTCSessionDescription(callerInfo.signal));
            // Add queued ICE candidates
            iceQueueRef.current.forEach(c => peer.addIceCandidate(new RTCIceCandidate(c)).catch(console.error));
            iceQueueRef.current = [];

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit('answerCall', { to: callerInfo.from, signal: answer });
        }
    };

    // ─── END A CALL ───
    const endCallLocally = () => {
        setCallState('idle');
        setReceivingCall(false);
        setCallerInfo(null);
        setCallDuration(0);

        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const rejectCall = () => {
        if (callerInfo?.from) {
            socket.emit('endCall', { to: callerInfo.from });
        }
        endCallLocally();
    };

    const leaveCall = () => {
        let toUser = activeChatUser?._id;
        if (callState === 'connected' && callerInfo) toUser = callerInfo.from;

        socket.emit('endCall', { to: toUser });
        endCallLocally();
    };

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleCam = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCamEnabled(videoTrack.enabled);
            }
        }
    };

    // Expose buttons via portal or just position absolute locally
    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* Header Call Buttons (injected via absolute positioning right over the chat header) */}
            {activeChatUser && callState === 'idle' && !receivingCall && (
                <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
                    <button onClick={() => initiateCall(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                        <Phone size={18} />
                    </button>
                    <button onClick={() => initiateCall(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                        <VideoIcon size={18} />
                    </button>
                </div>
            )}

            {/* Incoming Call Popup */}
            <AnimatePresence>
                {receivingCall && callState === 'idle' && (
                    <div className="absolute top-16 left-0 right-0 flex justify-center z-50 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="pointer-events-auto w-[90%] max-w-sm bg-[#1a1a2e] border border-white/20 p-3 md:p-4 rounded-2xl shadow-2xl flex items-center gap-2 md:gap-4"
                        >
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-lg md:text-xl uppercase shrink-0">
                                {callerInfo?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-white text-sm md:text-base truncate">{callerInfo?.name}</h3>
                                <p className="text-[10px] md:text-xs text-zinc-400 truncate">Incoming {callerInfo?.isVideoCall ? 'video' : 'voice'} call...</p>
                            </div>
                            <div className="flex gap-2 ml-auto shrink-0">
                                <button onClick={rejectCall} className="p-2 md:p-3 bg-red-500 hover:bg-red-600 rounded-full text-white">
                                    <PhoneOff size={16} className="md:w-[18px] md:h-[18px]" />
                                </button>
                                <button onClick={acceptCall} className="p-2 md:p-3 bg-green-500 hover:bg-green-600 rounded-full text-white">
                                    {callerInfo?.isVideoCall ? <VideoIcon size={16} className="md:w-[18px] md:h-[18px]" /> : <Phone size={16} className="md:w-[18px] md:h-[18px]" />}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Active Call UI */}
            <AnimatePresence>
                {(callState === 'calling' || callState === 'connected') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-auto absolute inset-0 bg-[#0f0f18]/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
                    >
                        {/* Remote Video / Status */}
                        {isVideoCall && callState === 'connected' ? (
                            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />

                                {/* Picture in Picture (Local Video) */}
                                <div className="absolute bottom-4 right-4 w-40 aspect-video bg-zinc-900 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                                    <video playsInline ref={myVideo} autoPlay muted className="w-full h-full object-cover" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-32 h-32 rounded-full border-4 border-indigo-500/50 bg-[#1a1a2e] flex items-center justify-center text-4xl uppercase font-bold animate-pulse">
                                    {callState === 'calling' ? (activeChatUser?.name?.charAt(0) || '?') : (callerInfo?.name?.charAt(0) || activeChatUser?.name?.charAt(0) || '?')}
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold">{callState === 'calling' ? activeChatUser?.name : (callerInfo?.name || activeChatUser?.name)}</h2>
                                    <p className="text-zinc-400 mt-1">
                                        {callState === 'calling' ? 'Calling...' : formatTime(callDuration)}
                                    </p>
                                </div>
                                {/* Use audio tags for voice calls to prevent browser engine suspension of hidden videos */}
                                <audio ref={myVideo} autoPlay muted className="hidden" />
                                <audio ref={userVideo} autoPlay className="hidden" />
                            </div>
                        )}

                        {/* Controls */}
                        <div className="absolute bottom-10 flex cursor-pointer items-center justify-center gap-6 bg-white/10 p-4 rounded-full backdrop-blur-lg">
                            <button onClick={toggleMic} className={`p-4 rounded-full transition-colors ${micEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}>
                                {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                            </button>

                            {isVideoCall && (
                                <button onClick={toggleCam} className={`p-4 rounded-full transition-colors ${camEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}>
                                    {camEnabled ? <VideoIcon size={24} /> : <VideoOff size={24} />}
                                </button>
                            )}

                            <button onClick={leaveCall} className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors">
                                <PhoneOff size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CallUI;
