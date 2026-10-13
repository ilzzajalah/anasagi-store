import React from 'react';
import { ChatLayout } from '../components/chat/ChatLayout';

interface ChatRoomPageProps {
  conversationId: string;
  navigate: (path: string) => void;
}

export function ChatRoomPage({ conversationId, navigate }: ChatRoomPageProps) {
  return <ChatLayout activeConversationId={conversationId} navigate={navigate} />;
}
