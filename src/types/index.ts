export type UserStatus = 'online' | 'offline' | 'busy' | 'away';

export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  email?: string;
  avatar: string;
  bio: string;
  status: UserStatus;
  lastSeen: string;
  role?: 'user' | 'admin';
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    onlineStatus: 'everyone' | 'same_as_last_seen';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    about: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
    statusAudience: 'everyone' | 'contacts' | 'selected';
  };
  blockedUserIds: string[];
  twoFactorEnabled?: boolean;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'location' 
  | 'contact';

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface MessageAttachment {
  type: MessageType;
  url: string;
  fileName?: string;
  fileSize?: string;
  duration?: number; // for audio/video in seconds
  thumbnailUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contact?: {
    name: string;
    phoneNumber: string;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachment?: MessageAttachment;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
    type: MessageType;
  };
  isEdited?: boolean;
  isPinned?: boolean;
  isStarred?: boolean;
  deletedForUserIds?: string[];
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  forwarded?: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  avatar?: string;
  participantIds: string[];
  adminIds?: string[];
  description?: string;
  createdAt: string;
  lastMessage?: Message;
  unreadCount?: number;
  isArchived?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  draft?: string;
  inviteCode?: string;
  onlyAdminsCanPost?: boolean;
}

export interface CallRecord {
  id: string;
  callerId: string;
  recipientIds: string[];
  chatId?: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  status: 'missed' | 'completed' | 'declined' | 'busy';
  startTime: string;
  durationSeconds: number;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  type: 'image' | 'video' | 'text';
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewers: {
    userId: string;
    viewedAt: string;
  }[];
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  bannerUrl: string;
  creatorId: string;
  adminIds: string[];
  memberCount: number;
  groupIds: string[];
  channels: {
    id: string;
    name: string;
    description: string;
    isAnnouncementOnly: boolean;
  }[];
  createdAt: string;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  viewCount: number;
  reactions: Record<string, number>;
}
