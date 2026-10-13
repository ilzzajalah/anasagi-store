import React from 'react';
import { ChatLayout } from '../components/chat/ChatLayout';

interface InboxPageProps {
  navigate: (path: string) => void;
}

export function InboxPage({ navigate }: InboxPageProps) {
  return <ChatLayout navigate={navigate} />;
}
