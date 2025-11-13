import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

type Session = {
  id: string;
  agent_type: string;
  created_at: string;
  session_id?: string;
};

export function ChatHistory({ onSelectSession, selectedSessionId }: {
  onSelectSession: (session: Session) => void;
  selectedSessionId: string | null;
}) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:8000/api/chat-history/${user.id}`)
        .then(res => res.json())
        .then(data => setSessions(data.sessions));
    }
  }, [user]);

  return (
    <aside className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Chat History</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="p-4 text-gray-500 dark:text-gray-400">No past chats yet.</div>
        )}
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800 transition ${
              selectedSessionId === session.session_id ? "bg-blue-100 dark:bg-blue-900 font-bold" : ""
            }`}
          >
            <span className="block text-sm">{session.agent_type}</span>
            <span className="block text-xs text-gray-500">{new Date(session.created_at).toLocaleString()}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}