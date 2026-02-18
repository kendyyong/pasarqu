import React, { createContext, useContext, useState, ReactNode } from "react";
import { ChatThread, ChatMessage } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

// MOCK INITIAL CHATS
const MOCK_THREADS: ChatThread[] = [
  {
    id: "thread_1",
    participantId: "user_seller_1",
    participantName: "Toko Sayur Bu Sri",
    participantRole: "Penjual",
    lastMessage: "Baik kak, pesanan segera diproses ya.",
    lastUpdated: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
    messages: [
      {
        id: "msg_1",
        senderId: "buyer_verified_1",
        text: "Halo Bu, apakah bayamnya masih segar?",
        timestamp: new Date(Date.now() - 3605000).toISOString(),
        isRead: true,
      },
      {
        id: "msg_2",
        senderId: "user_seller_1",
        text: "Masih kak, baru petik tadi pagi.",
        timestamp: new Date(Date.now() - 3602000).toISOString(),
        isRead: true,
      },
      {
        id: "msg_3",
        senderId: "user_seller_1",
        text: "Baik kak, pesanan segera diproses ya.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
      },
    ],
  },
];

interface ChatContextType {
  threads: ChatThread[];
  activeThreadId: string | null;
  unreadTotal: number;
  openChat: (
    participantId: string,
    participantName: string,
    role: string,
    orderId?: string,
  ) => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  setActiveThreadId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const unreadTotal = threads.reduce(
    (acc, thread) => acc + thread.unreadCount,
    0,
  );

  // Helper: Open Chat or Create New if not exists
  const openChat = (
    participantId: string,
    participantName: string,
    role: string,
    orderId?: string,
  ) => {
    const existingThread = threads.find(
      (t) => t.participantId === participantId,
    );

    if (existingThread) {
      setActiveThreadId(existingThread.id);
    } else {
      // Create new temporary thread structure
      const newThreadId = `thread_${Date.now()}`;
      const newThread: ChatThread = {
        id: newThreadId,
        participantId,
        participantName,
        participantRole: role,
        lastMessage: "Mulai percakapan...",
        lastUpdated: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
        relatedOrderId: orderId,
      };
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThreadId);
    }
  };

  const closeChat = () => {
    setActiveThreadId(null);
  };

  const sendMessage = (text: string) => {
    if (!activeThreadId || !user) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      text: text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...t.messages, newMessage],
            lastMessage: text,
            lastUpdated: new Date().toISOString(),
          };
        }
        return t;
      }),
    );

    // SIMULATE AUTO REPLY (Since we don't have backend)
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        senderId: "system_bot", // Or the participant ID
        text: getAutoReply(text),
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              messages: [...t.messages, replyMessage],
              lastMessage: replyMessage.text,
              lastUpdated: new Date().toISOString(),
              // If user is looking at this thread, unread is 0, else increment
              unreadCount: activeThreadId === t.id ? 0 : t.unreadCount + 1,
            };
          }
          return t;
        }),
      );
    }, 2000);
  };

  // Simple auto-reply logic for demo
  const getAutoReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes("ready") || lower.includes("stok"))
      return "Stok ready kak, silakan diorder.";
    if (lower.includes("kirim") || lower.includes("sampai"))
      return "Sedang dalam perjalanan ya kak.";
    if (lower.includes("terima kasih") || lower.includes("makasih"))
      return "Sama-sama kak! Ditunggu order selanjutnya.";
    return "Baik kak, pesan sudah diterima.";
  };

  return (
    <ChatContext.Provider
      value={{
        threads,
        activeThreadId,
        unreadTotal,
        openChat,
        closeChat,
        sendMessage,
        setActiveThreadId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
