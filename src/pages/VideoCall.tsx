/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Maximize2, 
  Minimize2,
  Users,
  Loader2,
  X,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  addDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoCall() {
  const { userId, callId } = useParams();
  const navigate = useNavigate();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'requesting' | 'connecting' | 'active' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTime, setCallTime] = useState(0);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    let interval: any;
    if (callStatus === 'active') {
      interval = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    isMounted.current = true;
    pc.current = new RTCPeerConnection(servers);
    const currentPc = pc.current;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        stream.getTracks().forEach((track) => {
          if (currentPc && currentPc.signalingState !== 'closed') {
            currentPc.addTrack(track, stream);
          }
        });

        currentPc.ontrack = (event) => {
          if (!isMounted.current) return;
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus('active');
        };

        if (callId) {
          joinCall(callId, currentPc);
        } else {
          createCall(userId!, currentPc);
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    startCall();

    return () => {
      isMounted.current = false;
      if (currentPc && currentPc.signalingState !== 'closed') {
        currentPc.close();
      }
    };
  }, []);

  const createCall = async (targetId: string, currentPc: RTCPeerConnection) => {
    const callDoc = doc(collection(db, 'calls'));
    const offerCandidates = collection(callDoc, 'callerCandidates');
    const answerCandidates = collection(callDoc, 'receiverCandidates');

    currentPc.onicecandidate = (event) => {
      if (event.candidate && isMounted.current) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await currentPc.createOffer();
    await currentPc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, { 
      offer,
      callerId: auth.currentUser?.uid,
      receiverId: targetId,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    onSnapshot(callDoc, (snapshot) => {
      if (!isMounted.current) return;
      const data = snapshot.data();
      if (currentPc.signalingState !== 'closed' && !currentPc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        currentPc.setRemoteDescription(answerDescription);
      }
      if (data?.status === 'rejected' || data?.status === 'ended') {
        endCall();
      }
    });

    onSnapshot(answerCandidates, (snapshot) => {
      if (!isMounted.current) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && currentPc.signalingState !== 'closed') {
          const data = change.doc.data();
          currentPc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    return callDoc.id;
  };

  const joinCall = async (id: string, currentPc: RTCPeerConnection) => {
    const callDoc = doc(db, 'calls', id);
    const answerCandidates = collection(callDoc, 'receiverCandidates');
    const offerCandidates = collection(callDoc, 'callerCandidates');

    currentPc.onicecandidate = (event) => {
      if (event.candidate && isMounted.current) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callData = (await getDoc(callDoc)).data();
    if (!callData || !isMounted.current) return;

    const offerDescription = callData.offer;
    if (currentPc.signalingState !== 'closed') {
      await currentPc.setRemoteDescription(new RTCSessionDescription(offerDescription));
      const answerDescription = await currentPc.createAnswer();
      await currentPc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await updateDoc(callDoc, { answer, status: 'accepted' });
    }

    onSnapshot(offerCandidates, (snapshot) => {
      if (!isMounted.current) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && currentPc.signalingState !== 'closed') {
          let data = change.doc.data();
          currentPc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    onSnapshot(callDoc, (snapshot) => {
      if (!isMounted.current) return;
      const data = snapshot.data();
      if (data?.status === 'ended' || data?.status === 'rejected') {
        endCall();
      }
    });
  };

  const endCall = async () => {
    if (callId) {
      await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
    }
    localStream?.getTracks().forEach(t => t.stop());
    navigate('/feed');
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled);
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col overflow-hidden selection:bg-primary selection:text-background font-sans">
      {/* Cinematic Background Grain Effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative overflow-hidden bg-[#050505]">
        <AnimatePresence>
          {remoteStream ? (
            <motion.video 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full" />
                  <div className="w-40 h-40 rounded-full glass flex items-center justify-center border border-white/10 relative z-10">
                     <Users className="text-primary animate-pulse" size={48} />
                  </div>
               </div>
               <div className="mt-12 text-center space-y-4 relative z-10">
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Transmisión Segura</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text/40 animate-pulse">
                   {callId ? 'SINCRONIZANDO SEÑAL...' : 'ESPERANDO RESPUESTA DEL CANAL...'}
                 </p>
               </div>
            </div>
          )}
        </AnimatePresence>

        {/* Local Video Overlay (Picture-in-Picture) */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, x: 20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          className="absolute bottom-12 right-12 w-64 h-80 rounded-[40px] overflow-hidden shadow-2xl border border-white/10 glass z-40 transform hover:scale-105 transition-transform"
        >
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-4">
              <VideoOff className="text-text/20" size={32} />
              <span className="text-[8px] font-black uppercase text-text/20 tracking-widest">Cámara Off</span>
            </div>
          )}
          <div className="absolute top-4 left-4 glass-dark px-3 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest border border-white/5">
             Preview
          </div>
        </motion.div>

        {/* Dynamic Watermark / Info */}
        <div className="absolute top-12 left-12 flex flex-col gap-6 z-40">
           <div className="glass-dark px-6 py-4 rounded-3xl border border-white/5 backdrop-blur-3xl flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Stream</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-3 text-white/60">
                 <Activity size={14} className="text-primary" />
                 <span className="text-[10px] font-black tracking-widest uppercase font-mono">{formatTime(callTime)}</span>
              </div>
           </div>
           
           <div className="flex gap-3">
              <div className="glass-dark p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                 <Shield size={14} className="text-emerald-500" />
                 <span className="text-[8px] font-black uppercase text-emerald-500/80 tracking-widest">Encriptado P2P</span>
              </div>
           </div>
        </div>
      </div>

      {/* Controls Bar */}
      <motion.div 
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        className="h-40 bg-zinc-950/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-center gap-8 px-12 pb-8 relative"
      >
        <button 
          onClick={toggleMute}
          className={`w-18 h-18 rounded-3xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-text hover:bg-white/10 border border-white/5'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button 
          onClick={endCall}
          className="group relative w-32 h-20 rounded-[35px] bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-3xl shadow-red-500/30 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <PhoneOff size={32} className="relative z-10" />
        </button>

        <button 
          onClick={toggleVideo}
          className={`w-18 h-18 rounded-3xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-text hover:bg-white/10 border border-white/5'}`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block">
           <div className="flex items-center gap-4 glass px-6 py-4 rounded-3xl border border-white/5">
              <Zap size={16} className="text-primary" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Calidad de Señal</span>
                 <span className="text-[10px] font-black uppercase text-primary tracking-tighter italic">Ultra HD @60fps</span>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
