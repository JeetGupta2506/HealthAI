import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, Stethoscope, Apple, Heart, MessageSquare, FileText } from 'lucide-react';

import { Button } from '../ui/Button';
import { ChatMessage } from '../../types/health';
import ReactMarkdown from "react-markdown"; 
import { useChat } from '../../contexts/ChatContext';
import { SimpleThemeToggle } from '../ui/ThemeToggle';
import { SettingsModal } from '../layout/SettingsModal';

const agentTypes = [
  { id: 'general', name: 'General Health', icon: <Stethoscope className="w-4 h-4" />, color: 'bg-blue-500' },
  { id: 'symptom', name: 'Symptom Checker', icon: <Heart className="w-4 h-4" />, color: 'bg-red-500' },
  { id: 'nutrition', name: 'Nutrition', icon: <Apple className="w-4 h-4" />, color: 'bg-green-500' },
  { id: 'mental-health', name: 'Mental Health', icon: <Brain className="w-4 h-4" />, color: 'bg-purple-500' }
];

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    content: "Hello! I'm your AI health assistant. I have specialized agents to help with different aspects of your health. How can I assist you today?",
    sender: 'ai',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    agentType: 'general'
  }
];

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent] = useState<string>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { responseStyle, setResponseStyle } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    dateOfBirth: '1990-01-01'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    // Debug log
    console.log("Sending to backend:", inputValue, selectedAgent, responseStyle);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          agent_type: selectedAgent,
          response_style: responseStyle
        })
      });
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        agentType: selectedAgent as any
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setError('Error communicating with AI backend.');
    } finally {
      setIsTyping(false);
    }
  };

  const getAgentInfo = (agentType?: string) => {
    return agentTypes.find(agent => agent.id === agentType) || agentTypes[0];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header with user profile, theme toggle, and response style selector */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Response Style Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium hidden sm:inline">Response:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setResponseStyle('concise')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    responseStyle === 'concise'
                      ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Concise</span>
                </button>
                <button
                  onClick={() => setResponseStyle('detailed')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    responseStyle === 'detailed'
                      ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Detailed</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <SimpleThemeToggle />
            
            {/* User Profile */}
            <Button 
              variant="ghost" 
              className="flex items-center gap-2"
              onClick={() => setIsSettingsOpen(true)}
            >
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden md:inline text-gray-700 dark:text-gray-200">
                {profileData.name}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' ? 'bg-gray-600 text-white' : getAgentInfo(message.agentType).color + ' text-white'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : getAgentInfo(message.agentType).icon}
                </div>
                                 <div className={`rounded-2xl px-4 py-3 ${
                   message.sender === 'user' 
                     ? 'bg-blue-600 text-white shadow-md' 
                     : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white shadow-md border border-gray-200 dark:border-gray-600'
                 }`}>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <p className={`text-xs mt-2 opacity-70`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAgentInfo(selectedAgent).color} text-white`}>
                  <Bot className="w-5 h-5" />
                </div>
                                 <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm px-4">{error}</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask the ${getAgentInfo(selectedAgent).name} agent... (${responseStyle === 'concise' ? 'brief' : 'detailed'} response)`}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isTyping}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        profileData={profileData}
        onProfileUpdate={setProfileData}
      />
    </div>
  );
}