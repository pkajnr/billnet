import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SkeletonDashboard } from '../components/SkeletonLoader';

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'read' | 'failed';
}

interface Conversation {
  userId: number;
  userName: string;
  profileImage?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface ChatUser {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  username?: string;
  email?: string;
  role?: string;
  profileImage?: string | null;
}

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Real-time chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [showPeople, setShowPeople] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showPeople) return;

    const trimmedQuery = searchQuery.trim();
    const isNumericQuery = /^\d+$/.test(trimmedQuery);

    if (!trimmedQuery) {
      setUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    if (!isNumericQuery && trimmedQuery.length < 2) {
      setUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchUsers(trimmedQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [showPeople, searchQuery]);

  useEffect(() => {
    const startConversationUserId = Number((location.state as any)?.startConversationUserId);
    const startConversationUserName = (location.state as any)?.startConversationUserName;
    if (Number.isFinite(startConversationUserId) && startConversationUserId > 0) {
      setSelectedConversation({
        userId: startConversationUserId,
        userName: startConversationUserName || 'User',
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      });
    }
  }, [location.state]);

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
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedConversation?.userId, chatMessages.length]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray((data as any)?.conversations) ? (data as any).conversations : [];

        const normalizedConversations: Conversation[] = list.map((item: any) => ({
          userId: item.other_user_id,
          userName: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown',
          profileImage: item.profile_image || null,
          lastMessage: item.last_message || '',
          lastMessageTime: item.last_message_time || new Date().toISOString(),
          unreadCount: Number(item.unread_count) || 0,
          isOnline: false,
        }));

        const sortedConversations = normalizedConversations.sort(
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

  const fetchUsers = async (query = '') => {
    try {
      setIsSearchingUsers(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}&limit=30`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const fetchChatMessages = async (userId: number) => {
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
        const list = Array.isArray((data as any)?.messages) ? (data as any).messages : [];
        
        const filtered = list
          .map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: `${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || 'Unknown',
            content: m.content,
            timestamp: m.created_at,
            isOwn: m.sender_id === currentUserId,
            deliveryStatus: m.sender_id === currentUserId
              ? (m.is_read ? 'read' : 'sent')
              : undefined,
          }))
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setChatMessages(filtered);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConversation) return;

    setIsSending(true);
    const message = chatInput;
    setChatInput('');

    const tempId = Date.now();
    const pendingMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName: 'You',
      content: message,
      timestamp: new Date().toISOString(),
      isOwn: true,
      deliveryStatus: 'sending',
    };

    setChatMessages((prev) => [...prev, pendingMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          content: message,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: responseData?.message?.id || tempId,
                  timestamp: responseData?.message?.created_at || msg.timestamp,
                  deliveryStatus: 'sent',
                }
              : msg
          )
        );
        fetchConversations();
      } else {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, deliveryStatus: 'failed' }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, deliveryStatus: 'failed' }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const selectUserForChat = (user: ChatUser) => {
    setSelectedConversation({
      userId: user.id,
      userName: user.name || `${user.firstName} ${user.lastName}`,
      profileImage: user.profileImage,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      isOnline: false,
    });
    setShowPeople(false);
    setSearchQuery('');
    setUsers([]);
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
            onClick={() => {
              const nextState = !showPeople;
              setShowPeople(nextState);
              if (!nextState) {
                setSearchQuery('');
                setUsers([]);
              }
            }}
            className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition duration-200"
          >
            + New Chat
          </button>
        </div>

        {showPeople && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pick a user to start chatting</h3>
            <div className="mb-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, email, or ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-2">Type at least 2 characters (or a numeric ID) to search.</p>
              {searchQuery.trim() && ((/^\d+$/.test(searchQuery.trim()) || searchQuery.trim().length >= 2)) && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {isSearchingUsers ? (
                    <p className="text-sm text-gray-500 p-3">Searching users...</p>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-gray-500 p-3">No users found</p>
                  ) : (
                    users.slice(0, 10).map((user) => (
                      <button
                        key={user.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectUserForChat(user);
                        }}
                        className="w-full text-left p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                      >
                        <p className="font-semibold text-gray-900 truncate">{user.name || `${user.firstName} ${user.lastName}`}</p>
                        <p className="text-xs text-gray-500 mt-1">@{user.username || 'user'} • {user.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {!searchQuery.trim() && <p className="text-sm text-gray-500">Start typing to search users.</p>}
            {!!searchQuery.trim() && (!/^\d+$/.test(searchQuery.trim()) && searchQuery.trim().length < 2) && (
              <p className="text-sm text-gray-500">Keep typing to search users.</p>
            )}
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

                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            {msg.isOwn && (
                              <span className="ml-2">
                                {msg.deliveryStatus === 'sending' && '◷'}
                                {msg.deliveryStatus === 'sent' && '✓'}
                                {msg.deliveryStatus === 'read' && '✓✓'}
                                {msg.deliveryStatus === 'failed' && '⚠ Not sent'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <form onSubmit={handleSendChatMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
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
