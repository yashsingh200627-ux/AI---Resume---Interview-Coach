import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { toggleCareerChat, setCareerChatOpen } from '../store/uiSlice';
import { careerApi } from '../services/api';
import {
  Send,
  X,
  Sparkles,
  User as UserIcon,
  Loader2,
  ArrowRight,
  Globe,
  History,
  RotateCcw,
  Trash2,
  Plus,
  ChevronLeft,
  MessageSquare,
  Clock,
  Check,
  Heart,
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  sender: 'user' | 'assistant';
  content: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  last_message?: string;
  messages?: ChatMessage[];
}

const GUEST_STORAGE_KEY = 'kuromi_guest_chat_sessions_v1';

export const CareerChatModal: React.FC = () => {
  const isOpen = useAppSelector((state) => state.ui.isCareerChatOpen);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // History state
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getWelcomeMessage = (): ChatMessage => ({
    sender: 'assistant',
    content: `Hello ${user?.full_name || 'there'}! I'm Kuromi, your personal Multilingual AI Career & Interview Coach. Ask me anything about skill gaps, resume improvements, interview tactics, or career transitions!\n\n🌐 You can talk to me in English, Hindi (हिंदी), Marathi (मराठी), or any language of your choice!`,
  });

  // Load chat history or welcome message on open
  useEffect(() => {
    if (isOpen) {
      if (!sessionId && messages.length === 0) {
        loadLatestActiveSession();
      }
      loadSessions();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, viewMode]);

  const loadLatestActiveSession = async () => {
    if (isAuthenticated) {
      try {
        const res = await careerApi.getMessages();
        if (res.data.session_id) {
          setSessionId(res.data.session_id);
        }
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(
            res.data.messages.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              content: m.content,
            }))
          );
          return;
        }
      } catch (err) {
        console.error('Failed to load active chat history', err);
      }
    } else {
      // Guest: check local storage
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        try {
          const list: ChatSessionItem[] = JSON.parse(raw);
          if (list && list.length > 0) {
            const latest = list[0];
            setSessionId(latest.id);
            if (latest.messages && latest.messages.length > 0) {
              setMessages(latest.messages);
              return;
            }
          }
        } catch (e) {
          console.error('Error loading guest session', e);
        }
      }
    }

    setMessages([getWelcomeMessage()]);
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      if (isAuthenticated) {
        const res = await careerApi.getSessions();
        setSessions(res.data || []);
      } else {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            setSessions(Array.isArray(list) ? list : []);
          } catch {
            setSessions([]);
          }
        } else {
          setSessions([]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat sessions', err);
      // Fallback to guest storage if offline/guest
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        try {
          setSessions(JSON.parse(raw));
        } catch {}
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await careerApi.sendMessage(text.trim(), sessionId);
      const returnedSessionId = res.data.session_id || sessionId || `guest_${Date.now()}`;
      if (res.data.session_id) {
        setSessionId(res.data.session_id);
      } else if (!sessionId) {
        setSessionId(returnedSessionId);
      }

      const botMessage: ChatMessage = { sender: 'assistant', content: res.data.message };
      const updatedAll = [...newMessages, botMessage];
      setMessages(updatedAll);

      // Save to guest storage if guest
      if (!isAuthenticated) {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        let guestList: ChatSessionItem[] = [];
        try {
          guestList = raw ? JSON.parse(raw) : [];
        } catch {}

        const snippet = text.trim().slice(0, 38) + (text.trim().length > 38 ? '...' : '');
        const existingIdx = guestList.findIndex((s) => s.id === returnedSessionId);

        if (existingIdx >= 0) {
          guestList[existingIdx].messages = updatedAll;
          guestList[existingIdx].updated_at = new Date().toISOString();
          guestList[existingIdx].message_count = updatedAll.length;
          guestList[existingIdx].last_message = res.data.message.slice(0, 80);
        } else {
          guestList.unshift({
            id: returnedSessionId,
            title: snippet || 'Career Consultation',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: updatedAll.length,
            last_message: res.data.message.slice(0, 80),
            messages: updatedAll,
          });
        }
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestList));
        setSessions(guestList);
      } else {
        // Refresh sessions list in background
        loadSessions();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        'Kuromi is currently processing high traffic. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: `⚠️ ${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setSessionId(undefined);
    setMessages([getWelcomeMessage()]);
    setInputText('');
    setViewMode('chat');
    showNotification('Started fresh chat with Kuromi');
  };

  const handleClearCurrentChat = () => {
    setSessionId(undefined);
    setMessages([getWelcomeMessage()]);
    setInputText('');
    showNotification('Chat cleared');
  };

  const handleSelectSession = async (selectedId: string) => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const res = await careerApi.getMessages(selectedId);
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(
            res.data.messages.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              content: m.content,
            }))
          );
        } else {
          setMessages([getWelcomeMessage()]);
        }
      } else {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const list: ChatSessionItem[] = JSON.parse(raw);
          const found = list.find((s) => s.id === selectedId);
          if (found && found.messages && found.messages.length > 0) {
            setMessages(found.messages);
          } else {
            setMessages([getWelcomeMessage()]);
          }
        }
      }
      setSessionId(selectedId);
      setViewMode('chat');
    } catch (err) {
      console.error('Failed to load selected session', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (targetSessionId: string) => {
    try {
      if (isAuthenticated) {
        await careerApi.deleteSession(targetSessionId);
      }
      // Also delete from local storage
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        try {
          const list = JSON.parse(raw).filter((s: any) => s.id !== targetSessionId);
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list));
        } catch {}
      }

      setSessions((prev) => prev.filter((s) => s.id !== targetSessionId));
      showNotification('Conversation deleted');

      // If active session was deleted, reset chat
      if (sessionId === targetSessionId) {
        setSessionId(undefined);
        setMessages([getWelcomeMessage()]);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to remove all saved conversation history?')) {
      return;
    }
    try {
      if (isAuthenticated) {
        await careerApi.clearAllSessions();
      }
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setSessions([]);
      setSessionId(undefined);
      setMessages([getWelcomeMessage()]);
      setViewMode('chat');
      showNotification('All conversation history cleared');
    } catch (err) {
      console.error('Failed to clear sessions', err);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const promptSuggestions = [
    'How can I improve my resume for my target role?',
    'मेरी प्रोफाइल के लिए कौन से स्किल्स जरूरी हैं? (Hindi)',
    'माझ्या बायोडाटा मध्ये काय सुधारणा हवी? (Marathi)',
    'What behavioral questions should I prepare for?',
  ];

  return (
    <>
      {/* Floating launcher trigger at bottom-right in stylish baby pink gradient */}
      <button
        onClick={() => dispatch(toggleCareerChat())}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white font-semibold text-sm shadow-xl shadow-pink-500/30 hover:scale-105 transition-all duration-200 cursor-pointer border border-pink-200/40"
        aria-label="Open Kuromi AI Career Coach"
      >
        <Sparkles className="w-4 h-4 text-pink-200 animate-spin" />
        <span className="hidden sm:inline font-['Fredoka',sans-serif] tracking-wide text-white">Ask Kuromi (Career AI)</span>
        <span className="sm:hidden font-['Fredoka',sans-serif] text-white">Kuromi AI</span>
      </button>

      {/* Transparent Click-Outside Dismiss Overlay (Preserves Side Background 100% Intact - No Blackout / No Blur) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/[0.04] dark:bg-black/[0.15] transition-opacity duration-300 cursor-default"
          onClick={() => dispatch(setCareerChatOpen(false))}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Chat Drawer with Antigravity-Style Smooth Dimensions & Animation */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] md:w-[490px] max-w-full flex flex-col bg-white dark:bg-[#181117] border-l border-slate-200 dark:border-[#3b2536] shadow-[-16px_0_40px_rgba(0,0,0,0.12)] dark:shadow-[-16px_0_45px_rgba(0,0,0,0.55)] transform transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Kuromi Career AI Coach"
      >
        {/* Notification Toast */}
        {notification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-sm flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <Check className="w-3.5 h-3.5 text-pink-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E2E8F0] dark:border-[#3b2536] flex items-center justify-between bg-slate-50/90 dark:bg-[#251823]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Kuromi Cute Avatar Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0">
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Kuromi Name Styled in Exquisite Font and Baby Pink Color */}
                <h3 className="text-base font-bold tracking-wide flex items-center gap-1.5 font-['Fredoka','Quicksand','Outfit',sans-serif] text-pink-500 dark:text-[#FFB6C1] drop-shadow-[0_1px_6px_rgba(255,182,193,0.45)]">
                  Kuromi
                  <span className="w-2 h-2 rounded-full bg-pink-400 dark:bg-[#FFB6C1] animate-pulse shadow-sm shadow-pink-400/60" />
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 text-pink-500 dark:text-pink-400" />
                  Multilingual AI
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                Hindi • Marathi • English • Global
              </p>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-1">
            {/* Antigravity History Button */}
            <button
              onClick={() => {
                const nextMode = viewMode === 'chat' ? 'history' : 'chat';
                setViewMode(nextMode);
                if (nextMode === 'history') {
                  loadSessions();
                }
              }}
              className={`p-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'history'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-pink-600'
              }`}
              title="Conversation History (Antigravity Style)"
              aria-label="Conversation History"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Clear Conversation Button */}
            <button
              onClick={handleClearCurrentChat}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="Clear current conversation"
              aria-label="Clear Conversation"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="Start New Conversation"
              aria-label="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => dispatch(setCareerChatOpen(false))}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer ml-0.5"
              title="Close drawer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode: HISTORY VIEW (Antigravity Style) */}
        {viewMode === 'history' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-[#181117]">
            {/* History Header Sub-bar */}
            <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#3b2536] flex items-center justify-between bg-white dark:bg-[#251823]">
              <button
                onClick={() => setViewMode('chat')}
                className="flex items-center gap-1 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Chat
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
                </span>
                {sessions.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Delete all conversation history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* History Sessions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {isLoadingSessions ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                  <span className="text-xs">Loading past conversations...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center text-pink-500 dark:text-[#FFB6C1] mb-3 shadow-sm">
                    <History className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    No Saved Conversations Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
                    Your past conversations with Kuromi will automatically be stored and preserved here. You can resume or delete them at any time.
                  </p>
                  <button
                    onClick={() => {
                      handleStartNewChat();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Start a New Chat
                  </button>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sessionId === sess.id;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-pink-50/70 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700 shadow-sm ring-1 ring-pink-400/30'
                          : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-[#1E293B] hover:border-pink-300 dark:hover:border-pink-900/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-pink-500 dark:text-[#FFB6C1]' : 'text-slate-400'
                            }`}
                          />
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {sess.title || 'Career Consultation'}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-900/80 text-pink-700 dark:text-[#FFB6C1] font-medium shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        {sess.last_message && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                            {sess.last_message}
                          </p>
                        )}

                        <div className="flex items-center gap-2.5 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(sess.updated_at || sess.created_at)}
                          </span>
                          <span>•</span>
                          <span>{sess.message_count || 1} messages</span>
                        </div>
                      </div>

                      {/* Delete Conversation Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sess.id);
                        }}
                        className="opacity-60 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer shrink-0"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* View Mode: ACTIVE CHAT VIEW */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center shrink-0 mt-0.5 text-pink-500 dark:text-[#FFB6C1]">
                      <Heart className="w-3.5 h-3.5 fill-pink-500 dark:fill-[#FFB6C1]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white rounded-br-none shadow-md shadow-pink-500/20'
                        : 'bg-slate-100 dark:bg-[#251823] text-[#0F172A] dark:text-[#FFF5F7] border border-[#E2E8F0] dark:border-[#3b2536] rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#251823] border border-slate-300 dark:border-[#3b2536] flex items-center justify-center shrink-0 mt-0.5 text-slate-700 dark:text-[#FFF5F7]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center shrink-0 text-pink-500 dark:text-[#FFB6C1]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-100 dark:bg-[#251823] border border-[#E2E8F0] dark:border-[#3b2536] rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-[#0F172A] dark:text-[#FFF5F7] flex items-center gap-2">
                    <span className="font-medium text-pink-600 dark:text-pink-300">Kuromi is analyzing in your language...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-[#251823]/70 border-t border-[#E2E8F0] dark:border-[#3b2536]">
                <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#E5CCD6] mb-2">
                  Suggested Inquiries (Multi-language):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {promptSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#251823] hover:bg-pink-50 dark:hover:bg-[#2c1c29] border border-[#E2E8F0] dark:border-[#3b2536] text-[#0F172A] dark:text-[#FFF5F7] transition flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>{suggestion}</span>
                      <ArrowRight className="w-3 h-3 text-pink-500 dark:text-pink-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-[#E2E8F0] dark:border-[#3b2536] bg-slate-50 dark:bg-[#251823] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Kuromi in English, हिन्दी, मराठी, or any language..."
                disabled={isLoading}
                className="flex-1 bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0F172A] dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white transition shrink-0 cursor-pointer shadow-md shadow-pink-500/25"
                title="Send message to Kuromi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
};
