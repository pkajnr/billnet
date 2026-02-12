import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';

interface Conversation {
  other_user_id: number;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  last_message: string;
  last_message_time: string;
  is_read: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_profile_image: string | null;
}

interface TypingState {
  isTyping: boolean;
  timeout: any;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typing, setTyping] = useState<TypingState>({ isTyping: false, timeout: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      if (selectedUserId) {
        fetchMessages(selectedUserId, true);
      }
      fetchConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    setTyping({ isTyping: true, timeout: null });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ isTyping: false, timeout: null });
    }, 1000);
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (userId: number, silent = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching messages:', error);
        showToast.error('Failed to load messages');
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUserId) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: newMessage.trim()
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedUserId);
        fetchConversations();
        showToast.success('Message sent successfully');
      } else {
        showToast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast.error('Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  const selectedConversation = conversations.find(c => c.other_user_id === selectedUserId);

  const filteredConversations = conversations.filter(conv =>
    `${conv.first_name} ${conv.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">💬 Messages</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition duration-200">
              <span className="text-xl">✏️</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 mt-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold mb-1">{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
              <p className="text-sm text-gray-400">{searchQuery ? 'Try a different search' : 'Start by sending a message'}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.other_user_id}
                onClick={() => {
                  setSelectedUserId(conv.other_user_id);
                  fetchMessages(conv.other_user_id);
                }}
                className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                  selectedUserId === conv.other_user_id ? 'bg-blue-50' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border border-gray-200">
                  {conv.profile_image ? (
                    <img src={conv.profile_image} alt={conv.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {conv.first_name[0]}{conv.last_name[0]}
                    </div>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-semibold text-gray-900 ${!conv.is_read ? 'font-bold' : ''}`}>
                      {conv.first_name} {conv.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className={`text-sm truncate ${!conv.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {conv.last_message}
                  </p>
                </div>

                {/* Unread Badge */}
                {!conv.is_read && (
                  <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUserId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                  {selectedConversation.profile_image ? (
                    <img src={selectedConversation.profile_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {selectedConversation.first_name[0]}{selectedConversation.last_name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.first_name} {selectedConversation.last_name}
                  </h2>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition">📞</button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">📹</button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">ℹ️</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-end">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-3">💬</div>
                  <p className="text-gray-500 font-semibold mb-1">No messages yet</p>
                  <p className="text-sm text-gray-400">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {typing.isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-300 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3 items-end">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600 hover:text-gray-900"
                >
                  ➕
                </button>
                <div className="flex-1 flex items-end gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e as any);
                      }
                    }}
                    placeholder="Aa"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex-shrink-0"
                  >
                    {isSending ? '⏳' : '➤'}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col">
            <div className="text-center">
              <div className="text-7xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Messages</h2>
              <p className="text-gray-500 mb-8">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
