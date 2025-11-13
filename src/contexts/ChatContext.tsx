import React, { createContext, useContext, useState } from 'react';

type ResponseStyle = 'concise' | 'detailed';

interface ChatContextValue {
  responseStyle: ResponseStyle;
  setResponseStyle: (s: ResponseStyle) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('concise');

  return (
    <ChatContext.Provider value={{ responseStyle, setResponseStyle }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
