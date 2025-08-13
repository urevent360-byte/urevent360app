import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Search, Phone, Video, MoreVertical } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.event_id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      // Generate sample conversations for demo
      const sampleConversations = generateSampleConversations();
      setConversations(sampleConversations);
      if (sampleConversations.length > 0) {
        setSelectedConversation(sampleConversations[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleConversations = () => [
    {
      id: '1',
      event_id: 'event_1',
      event_name: 'Sarah & John Wedding',
      vendor_name: 'Elegant Decorations',
      vendor_type: 'Decoration',
      last_message: 'Perfect! We can definitely work with your color scheme.',
      last_message_time: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      unread_count: 2,
      vendor_avatar: 'https://ui-avatars.com/api/?name=Elegant+Decorations&background=7c3aed&color=fff'
    },
    {
      id: '2',
      event_id: 'event_1',
      event_name: 'Sarah & John Wedding',
      vendor_name: 'Capture Moments Photography',
      vendor_type: 'Photography',
      last_message: 'I will be there 30 minutes early for setup.',
      last_message_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      unread_count: 0,
      vendor_avatar: 'https://ui-avatars.com/api/?name=Capture+Moments&background=f59e0b&color=fff'
    },
    {
      id: '3',
      event_id: 'event_2',
      event_name: 'Corporate Annual Meeting',
      vendor_name: 'Elite Catering Services',
      vendor_type: 'Catering',
      last_message: 'The menu looks great! When can we finalize the headcount?',
      last_message_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      unread_count: 1,
      vendor_avatar: 'https://ui-avatars.com/api/?name=Elite+Catering&background=10b981&color=fff'
    },
    {
      id: '4',
      event_id: 'event_1',
      event_name: 'Sarah & John Wedding',
      vendor_name: 'Sound & Rhythm DJ',
      vendor_type: 'Music/DJ',
      last_message: 'Got it! I have all your music preferences noted.',
      last_message_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      unread_count: 0,
      vendor_avatar: 'https://ui-avatars.com/api/?name=Sound+Rhythm&background=3b82f6&color=fff'
    }
  ];

  const fetchMessages = async (eventId) => {
    try {
      // Generate sample messages for demo
      const sampleMessages = generateSampleMessages(eventId);
      setMessages(sampleMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const generateSampleMessages = (eventId) => [
    {
      id: '1',
      event_id: eventId,
      sender_id: 'vendor_1',
      receiver_id: 'user_1',
      sender_type: 'vendor',
      message: 'Hello! Thank you for considering our decoration services for your wedding. I would love to discuss your vision.',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      read: true
    },
    {
      id: '2',
      event_id: eventId,
      sender_id: 'user_1',
      receiver_id: 'vendor_1',
      sender_type: 'user',
      message: 'Hi! We are looking for elegant decorations with a romantic theme. Our color scheme is blush pink and gold.',
      timestamp: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
      read: true
    },
    {
      id: '3',
      event_id: eventId,
      sender_id: 'vendor_1',
      receiver_id: 'user_1',
      sender_type: 'vendor',
      message: 'That sounds absolutely beautiful! Blush pink and gold is such an elegant combination. I have some amazing ideas that would work perfectly.',
      timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
      read: true
    },
    {
      id: '4',
      event_id: eventId,
      sender_id: 'vendor_1',
      receiver_id: 'user_1',
      sender_type: 'vendor',
      message: 'I can create centerpieces with blush roses and gold accents, along with draped fabric and fairy lights for ambiance.',
      timestamp: new Date(Date.now() - 86400000 * 2 + 3900000).toISOString(),
      read: true
    },
    {
      id: '5',
      event_id: eventId,
      sender_id: 'user_1',
      receiver_id: 'vendor_1',
      sender_type: 'user',
      message: 'That sounds perfect! Can you send me some photos of similar setups you have done?',
      timestamp: new Date(Date.now() - 86400000 + 7200000).toISOString(),
      read: true
    },
    {
      id: '6',
      event_id: eventId,
      sender_id: 'vendor_1',
      receiver_id: 'user_1',
      sender_type: 'vendor',
      message: 'Perfect! We can definitely work with your color scheme. I will send you our portfolio right away.',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false
    }
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      event_id: selectedConversation.event_id,
      receiver_id: 'vendor_1', // This would be dynamic in real app
      sender_type: 'user',
      message: newMessage
    };

    try {
      const response = await axios.post(`${API}/messages`, messageData);
      setMessages([...messages, response.data]);
      setNewMessage('');
      
      // Update conversation list
      setConversations(conversations.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: newMessage, last_message_time: new Date().toISOString() }
          : conv
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      // For demo, add message anyway
      const newMsg = {
        id: Date.now().toString(),
        event_id: selectedConversation.event_id,
        sender_id: 'user_1',
        receiver_id: 'vendor_1',
        sender_type: 'user',
        message: newMessage,
        timestamp: new Date().toISOString(),
        read: true
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return time.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.vendor_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 -m-6">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="h-12 w-12 mb-2" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={conversation.vendor_avatar}
                      alt={conversation.vendor_name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.vendor_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(conversation.last_message_time)}
                        </p>
                      </div>
                      <p className="text-xs text-purple-600 mb-1">
                        {conversation.event_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.last_message}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-600 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedConversation.vendor_avatar}
                    alt={selectedConversation.vendor_name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedConversation.vendor_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.vendor_type} • {selectedConversation.event_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender_type === 'user' ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="inline-flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a conversation from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;