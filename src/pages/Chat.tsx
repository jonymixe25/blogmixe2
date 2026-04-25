/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageCircle, 
  Search, 
  User as UserIcon,
  PlusSquare,
  ChevronLeft,
  MoreVertical,
  Circle,
  X,
  Video as VideoIcon
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const startVideoCall = () => {
    if (!selectedChat) return;
    const otherUserId = selectedChat.participants.find((p: string) => p !== auth.currentUser?.uid);
    navigate(`/call/${otherUserId}`);
  };

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/');
      return;
    }

    // Fetch user's chats
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser?.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const chatList = await Promise.all(snap.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUserId = data.participants.find((p: string) => p !== auth.currentUser?.uid);
        
        // Fetch other user profile
        let otherUser = { fullName: 'Usuario', id: otherUserId };
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, 'users', otherUserId));
          if (userSnap.exists()) {
            otherUser = { ...userSnap.data() as any, id: otherUserId };
          }
        }

        return {
          id: chatDoc.id,
          ...data,
          otherUser
        };
      }));

      // Sort by last update
      chatList.sort((a, b) => {
        const timeA = (a as any).updatedAt?.seconds || 0;
        const timeB = (b as any).updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      setChats(chatList);
      setLoading(false);
    });

    return unsub;
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return unsub;
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const msgData = {
        chatId: selectedChat.id,
        senderId: auth.currentUser.uid,
        text,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData);
      
      // Update chat last message
      await setDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error(err);
    }
  };

  const startChat = async (targetUser: any) => {
    if (!auth.currentUser) return;

    // Check if chat already exists
    const existing = chats.find(c => c.participants.includes(targetUser.id));
    if (existing) {
      setSelectedChat(existing);
      setShowUserSearch(false);
      return;
    }

    // Create new chat
    const chatId = [auth.currentUser.uid, targetUser.id].sort().join('_');
    await setDoc(doc(db, 'chats', chatId), {
      participants: [auth.currentUser.uid, targetUser.id],
      updatedAt: serverTimestamp(),
      lastMessage: 'Nueva conversación'
    });

    setShowUserSearch(false);
    setSearchTerm('');
  };

  const fetchUsers = async () => {
    const q = query(collection(db, 'users'), limit(20));
    const snap = await getDocs(q);
    setAvailableUsers(snap.docs.filter(d => d.id !== auth.currentUser?.uid).map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (showUserSearch) fetchUsers();
  }, [showUserSearch]);

  if (!user?.isLoggedIn) return null;

  return (
    <div className="flex h-screen bg-background pt-20 pb-20 md:pb-6 px-4 md:px-8 gap-6 md:pl-32 lg:pl-80 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-96 flex flex-col glass overflow-hidden rounded-[32px] border border-white/5 relative z-10 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <MessageCircle className="text-primary" size={24} />
              Chats
            </h2>
            <button 
              onClick={() => setShowUserSearch(true)}
              className="w-10 h-10 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-background transition-all flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
            >
              <PlusSquare size={20} />
            </button>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text/30">Tus conversaciones activas</span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          {chats.length > 0 ? (
            <div className="space-y-1">
              {chats.map((chat) => (
                <button 
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`group w-full p-6 flex items-center gap-5 hover:bg-white/[0.03] rounded-3xl transition-all text-left relative overflow-hidden ${selectedChat?.id === chat.id ? 'bg-white/[0.05] border border-white/5' : 'border border-transparent'}`}
                >
                  {selectedChat?.id === chat.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center flex-shrink-0 text-primary font-black text-xl group-hover:scale-105 transition-transform duration-500">
                    {chat.otherUser.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-display font-black text-white truncate uppercase tracking-tight">{chat.otherUser.fullName}</h4>
                    </div>
                    <p className="text-[11px] text-text/30 truncate font-bold">{chat.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-20">
              <MessageCircle size={64} className="mb-4 text-primary" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin conexiones</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col glass overflow-hidden rounded-[32px] border border-white/5 relative z-10 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 text-text/40 hover:text-white transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-2xl">
                    {selectedChat.otherUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-white uppercase tracking-tight text-lg">{selectedChat.otherUser.fullName}</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                       <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">En línea</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={startVideoCall}
                  className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-all group"
                  title="Video Llamada"
                >
                  <VideoIcon size={22} className="group-hover:scale-110 transition-transform" />
                </button>
                <button className="p-3 text-text/30 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth scrollbar-hide"
            >
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === auth.currentUser?.uid;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                
                return (
                  <div 
                    key={msg.id}
                    className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-lg bg-surface border border-white/5 flex items-center justify-center text-[10px] font-black text-primary/40 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                        {selectedChat.otherUser.fullName.charAt(0)}
                      </div>
                    )}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`max-w-[70%] p-5 rounded-[24px] text-xs font-bold leading-relaxed shadow-2xl ${
                        isMe 
                          ? 'bg-primary text-background rounded-tr-none' 
                          : 'bg-white/[0.02] border border-white/5 text-white/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 md:p-8 border-t border-white/5 bg-white/[0.01]">
              <div className="flex gap-4 relative">
                <input 
                  type="text"
                  placeholder="Escribe tu mensaje aquí..."
                  className="flex-1 bg-white/[0.02] border border-white/5 rounded-[24px] py-4 px-8 text-xs focus:outline-none focus:border-primary/30 transition-all font-bold text-white shadow-inner placeholder:text-text/20 placeholder:uppercase placeholder:tracking-widest"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-5 bg-primary text-background rounded-[24px] font-black shadow-2xl shadow-primary/20 active:scale-90 disabled:opacity-20 transition-all group"
                >
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white/[0.01] border border-white/5 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl">
              <MessageCircle className="text-primary/20" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-4">Central de <span className="text-primary">Mensajes</span></h3>
            <p className="text-text/30 max-w-xs text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">Conecta con los creadores de la comunidad y comparte tu visión creativa</p>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/40 backdrop-blur-3xl">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserSearch(false)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass p-1 max-h-[80vh] flex flex-col"
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">Nueva Conexión</h3>
                   <button onClick={() => setShowUserSearch(false)} className="p-2 text-text/30 hover:text-white transition-colors"><X size={20}/></button>
                </div>
                <div className="relative mb-8">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input 
                    type="text"
                    placeholder="BUSCAR CREADOR..."
                    className="input-field pl-16 rounded-[24px] bg-white/[0.02] border-white/5"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {searchTerm && availableUsers.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                    <button 
                      key={u.id}
                      onClick={() => startChat(u)}
                      className="w-full p-5 flex items-center gap-5 hover:bg-white/[0.03] rounded-[24px] border border-transparent hover:border-white/5 transition-all text-left group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl group-hover:scale-105 transition-transform">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-display font-black text-white uppercase tracking-tight text-lg">{u.fullName}</h4>
                        <p className="text-[10px] text-text/30 font-black uppercase tracking-widest">{u.email}</p>
                      </div>
                      <PlusSquare className="ml-auto text-primary/20 group-hover:text-primary transition-colors" size={24} />
                    </button>
                  ))}
                  {!searchTerm && <div className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-text/20">Empieza a escribir para buscar...</div>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
