import React, { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Bot, 
  Headphones, 
  Clock,
  CheckCircle,
  Minimize2
} from 'lucide-react';

const CustomerService = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceType, setServiceType] = useState(''); // '', 'human', 'ai'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const aiResponses = [
    "Hello! I'm your AI assistant. How can I help you today?",
    "I'd be happy to help you with that. Let me provide some information...",
    "For complex issues, I can connect you with a human agent. Would you like me to do that?",
    "Is there anything else I can assist you with today?",
    "Thank you for using our service. Have a great day!"
  ];

  const handleServiceTypeSelect = (type) => {
    setServiceType(type);
    const welcomeMessage = type === 'ai' 
      ? {
          id: Date.now(),
          sender: 'ai',
          message: "Hello! I'm your AI assistant. How can I help you with your event planning today?",
          timestamp: new Date().toLocaleTimeString()
        }
      : {
          id: Date.now(),
          sender: 'system',
          message: "Connecting you with a customer service representative. Please wait...",
          timestamp: new Date().toLocaleTimeString()
        };
    
    setMessages([welcomeMessage]);

    if (type === 'human') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'human',
          message: "Hi! I'm Sarah from customer service. How can I assist you today?",
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate AI response
    if (serviceType === 'ai') {
      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          message: aiResponses[Math.floor(Math.random() * aiResponses.length)],
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
    } else if (serviceType === 'human') {
      // Simulate human response
      setTimeout(() => {
        const responses = [
          "I understand your concern. Let me help you with that.",
          "That's a great question! Here's what I recommend...",
          "I'll check that information for you right away.",
          "Let me connect you with a specialist for this request.",
          "Is there anything else you'd like to know about our services?"
        ];
        const humanMessage = {
          id: Date.now() + 1,
          sender: 'human',
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, humanMessage]);
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setServiceType('');
    setMessages([]);
    setIsMinimized(false);
  };

  const getSenderIcon = (sender) => {
    switch (sender) {
      case 'ai': return <Bot className="w-4 h-4 text-blue-600" />;
      case 'human': return <Headphones className="w-4 h-4 text-green-600" />;
      case 'user': return <User className="w-4 h-4 text-purple-600" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSenderName = (sender) => {
    switch (sender) {
      case 'ai': return 'AI Assistant';
      case 'human': return 'Customer Service';
      case 'user': return 'You';
      default: return 'System';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          title="Customer Service"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-80 h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
              alt="Urevent 360 Logo" 
              className="h-6 w-6 object-contain bg-white/20 rounded-full p-1"
            />
            <div>
              <h3 className="font-semibold text-sm">Customer Service</h3>
              {serviceType && (
                <p className="text-xs text-white/80">
                  {serviceType === 'ai' ? 'AI Assistant' : 'Live Support'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeChat}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {!serviceType ? (
              /* Service Type Selection */
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">How can we help you?</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => handleServiceTypeSelect('ai')}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">AI Assistant</div>
                      <div className="text-sm text-gray-600">Quick answers, instant help</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleServiceTypeSelect('human')}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Headphones className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Live Support</div>
                      <div className="text-sm text-gray-600">Chat with our team</div>
                    </div>
                  </button>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Available 24/7</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Interface */
              <>
                {/* Messages */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {messages.map(message => (
                    <div key={message.id} className={`flex gap-2 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.sender !== 'user' && (
                        <div className="flex items-center gap-1">
                          {getSenderIcon(message.sender)}
                        </div>
                      )}
                      <div className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : message.sender === 'ai'
                          ? 'bg-blue-100 text-blue-900'
                          : message.sender === 'human'
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          {getSenderName(message.sender)} • {message.timestamp}
                        </div>
                      </div>
                      {message.sender === 'user' && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerService;