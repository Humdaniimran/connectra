import { User, Chat, Message, CallRecord, StatusUpdate, Community, ChannelPost } from '../types/index.ts';

export const api = {
  // Users
  async getUsers(query?: string): Promise<User[]> {
    const url = query ? `/api/users?q=${encodeURIComponent(query)}` : '/api/users';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async toggleBlockUser(userId: string, targetUserId: string, action: 'block' | 'unblock') {
    const res = await fetch(`/api/users/${userId}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, action }),
    });
    return res.json();
  },

  // Auth
  async sendOtp(phoneNumber: string) {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    return res.json();
  },

  async verifyOtp(phoneNumber: string, code: string, fullName?: string, username?: string) {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code, fullName, username }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(err.error || 'Verification failed');
    }
    return res.json();
  },

  async loginEmail(email: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async registerEmail(email: string, name?: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  // Group Member Management
  async addGroupMember(chatId: string, userId: string): Promise<Chat> {
    const res = await fetch(`/api/chats/${chatId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  },

  async removeGroupMember(chatId: string, userId: string): Promise<Chat> {
    const res = await fetch(`/api/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove member');
    return res.json();
  },

  async toggleGroupAdmin(chatId: string, userId: string, action: 'promote' | 'demote'): Promise<Chat> {
    const res = await fetch(`/api/chats/${chatId}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    if (!res.ok) throw new Error('Failed to update admin role');
    return res.json();
  },

  async leaveGroup(chatId: string, userId: string) {
    const res = await fetch(`/api/chats/${chatId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to leave group');
    return res.json();
  },

  // Chats
  async getChats(userId: string): Promise<Chat[]> {
    const res = await fetch(`/api/chats?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch chats');
    return res.json();
  },

  async createChat(payload: {
    type: 'direct' | 'group';
    participantIds: string[];
    name?: string;
    description?: string;
    avatar?: string;
    creatorId: string;
  }): Promise<Chat> {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create chat');
    return res.json();
  },

  async getMessages(chatId: string): Promise<Message[]> {
    const res = await fetch(`/api/chats/${chatId}/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async pinMessage(chatId: string, messageId: string, isPinned: boolean) {
    const res = await fetch(`/api/chats/${chatId}/pin-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, isPinned }),
    });
    return res.json();
  },

  async clearChat(chatId: string) {
    const res = await fetch(`/api/chats/${chatId}/clear`, { method: 'POST' });
    return res.json();
  },

  // Calls
  async getCalls(): Promise<CallRecord[]> {
    const res = await fetch('/api/calls');
    if (!res.ok) throw new Error('Failed to fetch calls');
    return res.json();
  },

  // Status updates
  async getStatuses(): Promise<StatusUpdate[]> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch statuses');
    return res.json();
  },

  async createStatus(payload: {
    userId: string;
    type: 'text' | 'image' | 'video';
    content?: string;
    mediaUrl?: string;
    backgroundColor?: string;
    caption?: string;
  }): Promise<StatusUpdate> {
    const res = await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async markStatusViewed(statusId: string, viewerId: string) {
    const res = await fetch(`/api/status/${statusId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewerId }),
    });
    return res.json();
  },

  // Communities
  async getCommunities(): Promise<Community[]> {
    const res = await fetch('/api/communities');
    return res.json();
  },

  async createCommunity(payload: {
    name: string;
    description: string;
    avatar?: string;
    bannerUrl?: string;
    creatorId: string;
  }): Promise<Community> {
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getChannelPosts(channelId: string): Promise<ChannelPost[]> {
    const res = await fetch(`/api/channels/${channelId}/posts`);
    return res.json();
  },

  async createChannelPost(payload: {
    channelId: string;
    authorId: string;
    title?: string;
    content: string;
    imageUrl?: string;
  }): Promise<ChannelPost> {
    const res = await fetch(`/api/channels/${payload.channelId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Upload
  async uploadMedia(dataUrl: string, fileName?: string, fileType?: string, fileSize?: string) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, fileName, fileType, fileSize }),
    });
    return res.json();
  },

  // Admin
  async getAdminMetrics() {
    const res = await fetch('/api/admin/metrics');
    return res.json();
  },

  async getAbuseReports() {
    const res = await fetch('/api/admin/reports');
    return res.json();
  },

  async submitAbuseReport(reporterId: string, reportedUserId: string, reason: string) {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId, reportedUserId, reason }),
    });
    return res.json();
  },

  // Export data
  async exportUserData(userId: string) {
    const res = await fetch(`/api/export/${userId}`);
    return res.json();
  },

  // Delete account
  async deleteAccount(userId: string) {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    return res.json();
  },
};
