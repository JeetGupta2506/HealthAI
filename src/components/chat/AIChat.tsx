import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, Stethoscope, Apple, Heart, MessageSquare, FileText, ChevronDown } from 'lucide-react';

import { Button } from '../ui/Button';
import { ChatMessage } from '../../types/health';
import ReactMarkdown from "react-markdown"; 

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
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed'>('concise');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAgentDropdown && !(event.target as Element).closest('.agent-dropdown')) {
        setShowAgentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAgentDropdown]);

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

    // Create a placeholder AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      agentType: selectedAgent as any
    };

    setMessages(prev => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId);
    setStreamingContent('');

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

      // Check if the response supports streaming
      if (response.headers.get('content-type')?.includes('text/plain') || 
          response.headers.get('content-type')?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              setStreamingContent(prev => prev + chunk);
              
              // Update the message content in real-time
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: prev.find(m => m.id === aiMessageId)?.content + chunk || chunk }
                  : msg
              ));
            }
          } finally {
            reader.releaseLock();
          }
        }
      } else {
        // Handle regular JSON response
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: data.response }
            : msg
        ));
      }
    } catch (err: any) {
      setError('Error communicating with AI backend.');
      // Remove the failed message
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
      setStreamingContent('');
    }
  };

  const getAgentInfo = (agentType?: string) => {
    return agentTypes.find(agent => agent.id === agentType) || agentTypes[0];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 my-6 mx-[50px] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">AI Health Assistant</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs">Multi-agent AI system powered by Gemini, LangGraph & CrewAI</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Response Style Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Style:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => setResponseStyle('concise')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                    responseStyle === 'concise'
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  Concise
                </button>
                <button
                  onClick={() => setResponseStyle('detailed')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                    responseStyle === 'detailed'
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Detailed
                </button>
              </div>
            </div>
            
            {/* Agent Selector Dropdown */}
            <div className="relative agent-dropdown">
              <button
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  {getAgentInfo(selectedAgent).icon}
                  <span className="font-medium text-sm">{getAgentInfo(selectedAgent).name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAgentDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showAgentDropdown && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 shadow-xl z-50">
                  {agentTypes.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setShowAgentDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                        selectedAgent === agent.id 
                          ? 'bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/30 dark:to-emerald-900/30 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-700 dark:text-gray-200'
                      } ${agent.id === agentTypes[0].id ? 'rounded-t-lg' : ''} ${agent.id === agentTypes[agentTypes.length - 1].id ? 'rounded-b-lg' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedAgent === agent.id 
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {agent.icon}
                      </div>
                      <span className="font-medium text-sm">{agent.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' ? 'bg-gray-600 text-white' : getAgentInfo(message.agentType).color + ' text-white'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : getAgentInfo(message.agentType).icon}
                </div>
                <div className={`rounded-xl px-3 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300' 
                    : 'bg-white/90 dark:bg-gray-700/90 text-gray-800 dark:text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 backdrop-blur-sm'
                }`}>
                  <div className="chat-markdown">
                    {message.content ? (
                      <div className="relative">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-800 dark:text-gray-200">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-800 dark:text-gray-200">{children}</ol>,
                            li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-1 text-gray-900 dark:text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-gray-900 dark:text-white">{children}</h3>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-700 dark:text-gray-300 mb-2">{children}</blockquote>,
                            code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">{children}</code>,
                            pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-600 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                            hr: () => <hr className="border-gray-300 dark:border-gray-600 my-2" />
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        {streamingMessageId === message.id && (
                          <span className="inline-block w-0.5 h-4 bg-blue-500 dark:bg-blue-400 ml-1 animate-pulse absolute bottom-0 right-0"></span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 opacity-70`}>
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
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600 shadow-md">
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
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask the ${getAgentInfo(selectedAgent).name} agent... (${responseStyle === 'concise' ? 'brief' : 'detailed'} response)`}
            className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-300"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isTyping || streamingMessageId !== null}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping || streamingMessageId !== null} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}