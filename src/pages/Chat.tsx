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
  ChevronLeft,
  MoreVertical,
  Circle
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
    <div className="flex h-screen bg-background pt-20 pb-20 md:pb-6 px-4 md:px-8 gap-6">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-96 flex flex-col glass overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="text-primary" size={20} />
            Mensajes
          </h2>
          <button 
            onClick={() => setShowUserSearch(true)}
            className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-background transition-all"
          >
            <PlusSquareIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {chats.length > 0 ? (
            <div className="divide-y divide-white/5">
              {chats.map((chat) => (
                <button 
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-6 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left ${selectedChat?.id === chat.id ? 'bg-white/[0.05]' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                    {chat.otherUser.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-text truncate">{chat.otherUser.fullName}</h4>
                    </div>
                    <p className="text-xs text-text/40 truncate">{chat.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-30">
              <MessageCircle size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Sin mensajes</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col glass overflow-hidden ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 text-text/40"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {selectedChat.otherUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-text">{selectedChat.otherUser.fullName}</h3>
                    <span className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">
                      <Circle size={6} fill="currentColor" /> en línea
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-text/30">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg) => {
                const isMe = msg.senderId === auth.currentUser?.uid;
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-primary text-background font-bold shadow-lg shadow-primary/20' 
                        : 'bg-surface border border-white/5 text-text'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-white/5">
              <div className="flex gap-4">
                <input 
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-surface border border-white/5 rounded-2xl py-3 px-6 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-4 bg-primary text-background rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-30 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="text-primary" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-text mb-2">Tus Mensajes</h3>
            <p className="text-text/30 max-w-xs">Selecciona una conversación para empezar a chatear con otros mezcladores.</p>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserSearch(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass max-h-[70vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold text-white mb-4">Nueva Conversación</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="input-field pl-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {availableUsers.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                  <button 
                    key={u.id}
                    onClick={() => startChat(u)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 rounded-xl transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text">{u.fullName}</h4>
                      <p className="text-xs text-text/40">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Missing import fix
const PlusSquareIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);
