import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, Stethoscope, Apple, Heart } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
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
    console.log("Sending to backend:", inputValue, selectedAgent);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          agent_type: selectedAgent
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
    <Card className="h-[600px] flex flex-col">
      <CardHeader 
        title="AI Health Assistant" 
        subtitle="Multi-agent AI system powered by Gemini, LangGraph & CrewAI"
      />
      {/* Agent Selector */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {agentTypes.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedAgent === agent.id 
                  ? `${agent.color} text-white shadow-md` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {agent.icon}
              {agent.name}
            </button>
          ))}
        </div>
      </div>
      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto">
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
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white'
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
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
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
      </CardContent>
      {/* Input */}
      <div className="px-6 pb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask the ${getAgentInfo(selectedAgent).name} agent...`}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isTyping}
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}