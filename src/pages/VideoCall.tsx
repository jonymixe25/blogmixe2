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
  X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
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
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const isMounted = useRef(true);

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
    navigate('/');
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
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col pt-12">
      {/* Remote Video (Background) */}
      <div className="flex-1 relative overflow-hidden bg-white/[0.02]">
        {remoteStream ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Users className="text-primary" size={40} />
            </div>
            <p className="text-text/40 font-black uppercase tracking-[0.3em] text-xs">
              {callId ? 'Conectando...' : 'Esperando respuesta...'}
            </p>
          </div>
        )}

        {/* Local Video Overlay */}
        <div className="absolute bottom-24 right-8 w-48 h-64 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 glass">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex items-center justify-center bg-background">
              <VideoOff className="text-text/20" size={32} />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="h-32 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-6 px-8"
      >
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/5 text-text hover:bg-white/10'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button 
          onClick={endCall}
          className="w-20 h-14 rounded-3xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-2xl shadow-red-500/20"
        >
          <PhoneOff size={24} />
        </button>

        <button 
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/5 text-text hover:bg-white/10'}`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
      </motion.div>

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Llamada 1:1 En Vivo</span>
          </div>
        </div>
        
        <button 
          onClick={endCall}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
