import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  isTyping?: boolean;
}

interface Conversation {
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

export default function Messages() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Real-time chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationUserId, setNewConversationUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchChatMessages(selectedConversation.userId);
      const interval = setInterval(() => {
        fetchChatMessages(selectedConversation.userId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.messages) ? (data as any).messages : [];
        
        const convMap = new Map<number, Conversation>();
        list.forEach((m: any) => {
          const senderId = m.senderId || m.sender_id;
          const senderName = m.senderName || m.sender_name || m.sender_name_full || m.senderNameFull || 'Unknown';
          const isRead = m.isRead !== undefined ? !!m.isRead : !!m.is_read;
          
          if (!convMap.has(senderId)) {
            convMap.set(senderId, {
              userId: senderId,
              userName: senderName,
              lastMessage: m.content || m.subject || '',
              lastMessageTime: m.createdAt || m.created_at,
              unreadCount: 0,
              isOnline: Math.random() > 0.5,
            });
          }
          
          const conv = convMap.get(senderId)!;
          if (!isRead) conv.unreadCount++;
          if (new Date(m.createdAt || m.created_at) > new Date(conv.lastMessageTime)) {
            conv.lastMessage = m.content || m.subject || '';
            conv.lastMessageTime = m.createdAt || m.created_at;
          }
        });

        const sortedConversations = Array.from(convMap.values()).sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        setConversations(sortedConversations);
        setIsLoading(false);
      } else if (response.status === 401) {
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setIsLoading(false);
    }
  };

  const fetchChatMessages = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.messages) ? (data as any).messages : [];
        const currentUserId = parseInt(localStorage.getItem('userId') || '0', 10);
        
        const filtered = list
          .filter((m: any) => {
            const senderId = m.senderId || m.sender_id;
            return senderId === userId || senderId === currentUserId;
          })
          .map((m: any) => {
            const senderId = m.senderId || m.sender_id;
            return {
              id: m.id,
              senderId,
              senderName: m.senderName || m.sender_name || 'Unknown',
              content: m.content,
              timestamp: m.createdAt || m.created_at,
              isOwn: senderId === currentUserId,
            };
          })
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setChatMessages(filtered);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConversation) return;

    setIsSending(true);
    const message = chatInput;
    setChatInput('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedConversation.userId,
          subject: 'Chat',
          content: message,
        }),
      });

      if (response.ok) {
        const currentUserId = parseInt(localStorage.getItem('userId') || '0', 10);
        const newMsg: ChatMessage = {
          id: Date.now(),
          senderId: currentUserId,
          senderName: 'You',
          content: message,
          timestamp: new Date().toISOString(),
          isOwn: true,
        };
        setChatMessages([...chatMessages, newMsg]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatInput(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConversationUserId.trim()) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const userId = parseInt(newConversationUserId, 10);
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: userId,
          content: 'Hi! I would like to connect with you.',
        }),
      });

      if (response.ok) {
        setNewConversationUserId('');
        setShowNewConversation(false);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">💬 Instant Messaging</h1>
            <p className="text-gray-600 mt-2">Connect with entrepreneurs and investors in real-time</p>
          </div>
          <button
            onClick={() => setShowNewConversation(!showNewConversation)}
            className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition duration-200"
          >
            + New Chat
          </button>
        </div>

        {showNewConversation && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start a New Conversation</h3>
            <form onSubmit={handleStartNewConversation} className="flex gap-3">
              <input
                type="number"
                placeholder="Enter user ID"
                value={newConversationUserId}
                onChange={(e) => setNewConversationUserId(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
              <button
                type="submit"
                disabled={isSending || !newConversationUserId.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition duration-200"
              >
                {isSending ? 'Starting...' : 'Start Chat'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
              <h2 className="font-semibold text-gray-900 text-lg">👥 Conversations</h2>
              <p className="text-xs text-gray-500 mt-1">{conversations.length} active chats</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-blue-50 transition duration-200 ${
                      selectedConversation?.userId === conv.userId ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">{conv.userName}</p>
                          {conv.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conv.lastMessageTime).toLocaleDateString()}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-center p-6">
                  <div>
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                    <p className="text-gray-400 text-xs mt-2">Start a new chat to connect</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedConversation.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedConversation.userName}</p>
                      {selectedConversation.isOnline && <p className="text-xs text-green-600">Online</p>}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.isOwn
                              ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  )}
                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <form onSubmit={handleSendChatMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !chatInput.trim()}
                      className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-semibold transition duration-200"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-600 font-semibold">Select a conversation to start</p>
                  <p className="text-gray-500 text-sm mt-2">Choose from your conversations or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
