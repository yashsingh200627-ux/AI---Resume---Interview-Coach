import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { careerApi } from '../services/api';
import {
  Compass,
  User,
  Send,
  Loader2,
  ArrowRight,
  Trash2,
  History,
  RotateCcw,
  Plus,
  ChevronLeft,
  MessageSquare,
  Clock,
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

export const CareerCoachPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // History state
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getWelcomeMessage = (): ChatMessage => ({
    sender: 'assistant',
    content: `Hello ${user?.full_name || 'there'}! I am **Kuromi**, your personalized Multilingual AI Career & Interview Coach. I have full context of your verified profile, background, and target role (${user?.target_job_role || 'Software Engineer'}). What career objectives, skill transitions, or interview strategies would you like to explore today?\n\n🌐 You can talk to me in English, Hindi (हिंदी), Marathi (मराठी), or any language of your choice!`,
  });

  useEffect(() => {
    loadChat();
    loadSessions();
  }, []);

  useEffect(() => {
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, viewMode]);

  const loadChat = async () => {
    try {
      const res = await careerApi.getMessages();
      if (res.data.session_id) setSessionId(res.data.session_id);
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(
          res.data.messages.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
          }))
        );
      } else {
        // Fallback to guest storage if available
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          try {
            const list: ChatSessionItem[] = JSON.parse(raw);
            if (list.length > 0 && list[0].messages && list[0].messages.length > 0) {
              setSessionId(list[0].id);
              setMessages(list[0].messages);
              return;
            }
          } catch {}
        }
        setMessages([getWelcomeMessage()]);
      }
    } catch (e) {
      console.error(e);
      setMessages([getWelcomeMessage()]);
    }
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await careerApi.getSessions();
      if (res.data && Array.isArray(res.data)) {
        setSessions(res.data);
      } else {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          setSessions(JSON.parse(raw));
        }
      }
    } catch {
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

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { sender: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await careerApi.sendMessage(text.trim(), sessionId);
      const returnedSessionId = res.data.session_id || sessionId || `guest_${Date.now()}`;
      if (res.data.session_id) setSessionId(res.data.session_id);
      else if (!sessionId) setSessionId(returnedSessionId);

      const botMsg: ChatMessage = { sender: 'assistant', content: res.data.message };
      const allUpdated = [...nextMessages, botMsg];
      setMessages(allUpdated);

      // Save to guest storage fallback
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      let guestList: ChatSessionItem[] = [];
      try {
        guestList = raw ? JSON.parse(raw) : [];
      } catch {}

      const snippet = text.trim().slice(0, 38) + (text.trim().length > 38 ? '...' : '');
      const existingIdx = guestList.findIndex((s) => s.id === returnedSessionId);

      if (existingIdx >= 0) {
        guestList[existingIdx].messages = allUpdated;
        guestList[existingIdx].updated_at = new Date().toISOString();
        guestList[existingIdx].message_count = allUpdated.length;
        guestList[existingIdx].last_message = res.data.message.slice(0, 80);
      } else {
        guestList.unshift({
          id: returnedSessionId,
          title: snippet || 'Career Consultation',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: allUpdated.length,
          last_message: res.data.message.slice(0, 80),
          messages: allUpdated,
        });
      }
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestList));
      loadSessions();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        'Kuromi AI service is temporarily experiencing high load. Please try again.';
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', content: `⚠️ ${msg}` },
      ]);
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  // Antigravity-Style Delete Current Chat Action
  const handleDeleteCurrentChat = async () => {
    if (sessionId) {
      try {
        await careerApi.deleteSession(sessionId);
      } catch (e) {
        console.error('Failed to delete session on backend', e);
      }

      // Remove from localStorage
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        try {
          const list = JSON.parse(raw).filter((s: any) => s.id !== sessionId);
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list));
        } catch {}
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }

    setSessionId(undefined);
    setMessages([getWelcomeMessage()]);
    setInputText('');
    dispatch(addToast({ type: 'success', message: 'Chat deleted. Started a fresh conversation.' }));
    loadSessions();
  };

  // Delete Individual Session from History
  const handleDeleteSession = async (targetId: string) => {
    try {
      await careerApi.deleteSession(targetId);
    } catch (e) {
      console.error('Failed to delete session', e);
    }

    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      try {
        const list = JSON.parse(raw).filter((s: any) => s.id !== targetId);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list));
      } catch {}
    }

    setSessions((prev) => prev.filter((s) => s.id !== targetId));
    dispatch(addToast({ type: 'success', message: 'Conversation deleted from history' }));

    if (sessionId === targetId) {
      setSessionId(undefined);
      setMessages([getWelcomeMessage()]);
    }
  };

  // Clear All History
  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all past conversation history?')) {
      return;
    }
    try {
      await careerApi.clearAllSessions();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setSessions([]);
    setSessionId(undefined);
    setMessages([getWelcomeMessage()]);
    setViewMode('chat');
    dispatch(addToast({ type: 'success', message: 'All conversation history has been cleared.' }));
  };

  // Select Session from History
  const handleSelectSession = async (targetId: string) => {
    setIsLoading(true);
    try {
      const res = await careerApi.getMessages(targetId);
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(
          res.data.messages.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
          }))
        );
      } else {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((s: any) => s.id === targetId);
          if (found && found.messages) {
            setMessages(found.messages);
          }
        }
      }
      setSessionId(targetId);
      setViewMode('chat');
    } catch (err) {
      console.error('Failed to load session', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
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

  const quickInquiries = [
    `What skills do I need to transition from ${user?.experience_level || 'Mid-Level'} to Senior?`,
    'मेरी प्रोफाइल के लिए कौन से स्किल्स जरूरी हैं? (Hindi)',
    'माझ्या बायोडाटा मध्ये काय सुधारणा हवी? (Marathi)',
    'What are the most effective negotiation strategies for my target role?',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Career Coach &amp; Mentor
            <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-medium">
              Powered by Kuromi
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Direct strategic guidance anchored on your real background, recorded skills, and target career goals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-12rem)]">
        {/* Left Information & Prompts */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Target Role Focus</h3>
                <p className="text-xs text-pink-400 font-medium">{user?.target_job_role || 'General'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike generic chatbots, <span className="text-pink-400 font-semibold">Kuromi AI</span> evaluates your actual profile, technical skill gaps, and interview performance metrics to deliver tactical advice.
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Suggested Career Questions:
              </span>
              <div className="space-y-1.5">
                {quickInquiries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (viewMode === 'history') setViewMode('chat');
                      handleSend(q);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/40 text-xs text-slate-300 hover:text-white transition flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <span className="line-clamp-2">{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-400 shrink-0 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/20 text-[11px] text-pink-200">
            💡 <strong>Pro-Tip:</strong> Ask Kuromi for specific portfolio project suggestions or salary negotiation talking points in your preferred language.
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
          {/* Antigravity-Style Top Chat Header with Delete, History, Clear & New Controls */}
          <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0">
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wide font-['Fredoka','Outfit',sans-serif] text-pink-400 dark:text-[#FFB6C1] truncate">
                    Kuromi AI Coach
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shrink-0" />
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-950/60 text-pink-300 border border-pink-800/40 shrink-0">
                    Multilingual
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {sessionId ? 'Active Session' : 'New Session'} • English, हिन्दी, मराठी
                </p>
              </div>
            </div>

            {/* Antigravity Action Toolbar: History, Delete Chat, Reset, New */}
            <div className="flex items-center gap-1.5">
              {/* Antigravity History Button */}
              <button
                onClick={() => {
                  const next = viewMode === 'chat' ? 'history' : 'chat';
                  setViewMode(next);
                  if (next === 'history') loadSessions();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'history'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                    : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700'
                }`}
                title="Chat History (Antigravity Style)"
                aria-label="View Chat History"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
              </button>

              {/* Delete Chat Button (Antigravity Style) */}
              <button
                onClick={handleDeleteCurrentChat}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-800/50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Delete Chat (Antigravity Style)"
                aria-label="Delete Chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Chat</span>
              </button>

              {/* Clear / Reset Conversation */}
              <button
                onClick={() => {
                  setSessionId(undefined);
                  setMessages([getWelcomeMessage()]);
                  setInputText('');
                  dispatch(addToast({ type: 'info', message: 'Chat reset' }));
                }}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center gap-1"
                title="Clear current conversation"
                aria-label="Clear chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Clear</span>
              </button>

              {/* New Conversation Button */}
              <button
                onClick={() => {
                  setSessionId(undefined);
                  setMessages([getWelcomeMessage()]);
                  setInputText('');
                  setViewMode('chat');
                  dispatch(addToast({ type: 'success', message: 'Started new conversation' }));
                }}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-pink-400 bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center gap-1"
                title="Start new conversation"
                aria-label="New chat"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New</span>
              </button>
            </div>
          </div>

          {/* Antigravity HISTORY VIEW Mode */}
          {viewMode === 'history' ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/60">
              {/* History Sub-header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <button
                  onClick={() => setViewMode('chat')}
                  className="flex items-center gap-1 text-xs font-semibold text-pink-400 hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Chat
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">
                    {sessions.length} {sessions.length === 1 ? 'saved conversation' : 'saved conversations'}
                  </span>
                  {sessions.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-lg hover:bg-red-950/40 transition cursor-pointer"
                      title="Clear all saved history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All History</span>
                    </button>
                  )}
                </div>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {isLoadingSessions ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                    <span className="text-xs">Loading conversations...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-pink-950/30 border border-pink-800/40 flex items-center justify-center text-pink-400 mb-3 shadow-sm">
                      <History className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">
                      No Saved Conversations Yet
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mb-4">
                      Your conversations with Kuromi are automatically stored and preserved here. You can resume or delete them at any time.
                    </p>
                    <button
                      onClick={() => {
                        setSessionId(undefined);
                        setMessages([getWelcomeMessage()]);
                        setViewMode('chat');
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
                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isActive
                            ? 'bg-pink-950/30 border-pink-600 shadow-sm ring-1 ring-pink-500/30'
                            : 'bg-slate-900 border-slate-800 hover:border-pink-500/40 hover:shadow-md'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-pink-400' : 'text-slate-400'
                              }`}
                            />
                            <h4 className="text-xs font-semibold text-slate-100 truncate">
                              {sess.title || 'Career Consultation'}
                            </h4>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-pink-900/80 text-pink-300 font-medium shrink-0">
                                Active
                              </span>
                            )}
                          </div>

                          {sess.last_message && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                              {sess.last_message}
                            </p>
                          )}

                          <div className="flex items-center gap-2.5 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(sess.updated_at || sess.created_at)}
                            </span>
                            <span>•</span>
                            <span>{sess.message_count || 1} messages</span>
                          </div>
                        </div>

                        {/* Individual Delete Button on Each History Card */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(sess.id);
                          }}
                          className="opacity-70 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/50 transition cursor-pointer shrink-0"
                          title="Delete this conversation"
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
            /* ACTIVE CHAT VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-pink-950/60 border border-pink-800/40 flex items-center justify-center shrink-0 mt-0.5 text-pink-400">
                        <Heart className="w-4 h-4 fill-pink-400" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white rounded-br-none shadow-md shadow-pink-600/20'
                          : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>

                    {m.sender === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 items-center text-xs text-slate-400">
                    <div className="w-8 h-8 rounded-xl bg-pink-950/60 border border-pink-800/40 flex items-center justify-center text-pink-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <span className="font-medium text-pink-400">Kuromi AI is evaluating your profile and generating personalized advice...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask Kuromi in English, हिन्दी, मराठी, or any language..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-pink-600/30 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
