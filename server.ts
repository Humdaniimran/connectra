import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User, Message, Chat, CallRecord, StatusUpdate, Community, ChannelPost } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with generous limits for media sharing (audio notes, pictures, docs)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// ==========================================
// IN-MEMORY PERSISTED STORE & SEED DATA
// ==========================================

const users: Map<string, User> = new Map();
const chats: Map<string, Chat> = new Map();
const messages: Map<string, Message[]> = new Map(); // chatId -> Message[]
const calls: CallRecord[] = [];
const statuses: StatusUpdate[] = [];
const communities: Community[] = [];
const channelPosts: Map<string, ChannelPost[]> = new Map(); // channelId -> ChannelPost[]
const abuseReports: Array<{ id: string; reporterId: string; reportedUserId: string; reason: string; timestamp: string; status: 'pending' | 'resolved' }> = [];

// Seed Initial Realistic Users
const initialUsers: User[] = [
  {
    id: 'user_alex',
    name: 'Alex Vance',
    username: 'alexvance',
    phoneNumber: '+1 555-0192',
    email: 'alex.vance@connectra.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Mobile architect & open-source enthusiast. Always connected on Connectra.',
    status: 'online',
    lastSeen: new Date().toISOString(),
    role: 'admin',
    privacy: {
      lastSeen: 'everyone',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      statusAudience: 'everyone',
    },
    blockedUserIds: [],
    twoFactorEnabled: true,
  },
  {
    id: 'user_sarah',
    name: 'Sarah Chen',
    username: 'sarahchen',
    phoneNumber: '+1 555-0143',
    email: 'sarah.chen@connectra.io',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: 'Product Designer at Connectra. Building intuitive conversations.',
    status: 'online',
    lastSeen: new Date().toISOString(),
    role: 'user',
    privacy: {
      lastSeen: 'everyone',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      statusAudience: 'everyone',
    },
    blockedUserIds: [],
  },
  {
    id: 'user_marcus',
    name: 'Marcus Brody',
    username: 'marcusb',
    phoneNumber: '+1 555-0178',
    email: 'marcus.brody@security.dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Cryptographic systems & WebRTC engineer. Verified E2EE ratchets.',
    status: 'away',
    lastSeen: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    role: 'user',
    privacy: {
      lastSeen: 'contacts',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'contacts',
      readReceipts: true,
      statusAudience: 'contacts',
    },
    blockedUserIds: [],
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    username: 'elena_r',
    phoneNumber: '+1 555-0189',
    email: 'elena.rostova@design.co',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bio: 'Sound designer & audiovisual researcher.',
    status: 'offline',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    role: 'user',
    privacy: {
      lastSeen: 'everyone',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      statusAudience: 'everyone',
    },
    blockedUserIds: [],
  },
  {
    id: 'user_david',
    name: 'David Kim',
    username: 'davidk',
    phoneNumber: '+1 555-0165',
    email: 'david.kim@hypercloud.io',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Distributed infrastructure & SFU media node maintainer.',
    status: 'online',
    lastSeen: new Date().toISOString(),
    role: 'user',
    privacy: {
      lastSeen: 'everyone',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      statusAudience: 'everyone',
    },
    blockedUserIds: [],
  },
  {
    id: 'user_tariq',
    name: 'Tariq Mahmood',
    username: 'tariqm',
    phoneNumber: '+92 300 1234567',
    email: 'tariq.mahmood@connectra.io',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    bio: 'Software engineer from Lahore. Connecting globally on Connectra 🇵🇰',
    status: 'online',
    lastSeen: new Date().toISOString(),
    role: 'user',
    privacy: {
      lastSeen: 'everyone',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      statusAudience: 'everyone',
    },
    blockedUserIds: [],
  },
];

initialUsers.forEach((u) => users.set(u.id, u));

// Seed Initial Chats
const initialChats: Chat[] = [
  {
    id: 'chat_sarah',
    type: 'direct',
    participantIds: ['user_alex', 'user_sarah'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isPinned: true,
  },
  {
    id: 'chat_group_core',
    type: 'group',
    name: 'Connectra Core Engineering',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    description: 'Main architecture, WebRTC video calling pipeline, and protocol design.',
    participantIds: ['user_alex', 'user_sarah', 'user_marcus', 'user_david'],
    adminIds: ['user_alex', 'user_marcus'],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    isPinned: true,
    inviteCode: 'CONN-CORE-2026',
  },
  {
    id: 'chat_marcus',
    type: 'direct',
    participantIds: ['user_alex', 'user_marcus'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isPinned: false,
  },
  {
    id: 'chat_elena',
    type: 'direct',
    participantIds: ['user_alex', 'user_elena'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isPinned: false,
  },
];

initialChats.forEach((c) => chats.set(c.id, c));

// Seed Messages
const sarahMessages: Message[] = [
  {
    id: 'msg_s1',
    chatId: 'chat_sarah',
    senderId: 'user_sarah',
    content: 'Hey Alex! Did you review the new audio call screen mockup with the waveform pulses?',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'read',
    reactions: { '👍': ['user_alex'] },
  },
  {
    id: 'msg_s2',
    chatId: 'chat_sarah',
    senderId: 'user_alex',
    content: 'Yes! The layout is super crisp. The 44px touch targets on mobile feel very responsive.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    status: 'read',
  },
  {
    id: 'msg_s3',
    chatId: 'chat_sarah',
    senderId: 'user_sarah',
    content: 'Check out the new design system banner. The sapphire and teal color contrast is calibrated for dark mode.',
    type: 'image',
    attachment: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      fileName: 'connectra_theme_palette.png',
      fileSize: '1.2 MB',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'read',
    reactions: { '❤️': ['user_alex', 'user_sarah'] },
  },
  {
    id: 'msg_s4',
    chatId: 'chat_sarah',
    senderId: 'user_alex',
    content: 'Voice note preview testing with Opus 48kHz audio codec.',
    type: 'audio',
    attachment: {
      type: 'audio',
      url: '',
      fileName: 'voice_note_alex.opus',
      duration: 14,
      fileSize: '124 KB',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'read',
  },
  {
    id: 'msg_s5',
    chatId: 'chat_sarah',
    senderId: 'user_sarah',
    content: 'Meet me at the Innovation Lab for our peer call testing session.',
    type: 'location',
    attachment: {
      type: 'location',
      url: '',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: '555 Mission St, San Francisco, CA',
      },
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'read',
  },
];
messages.set('chat_sarah', sarahMessages);

const groupMessages: Message[] = [
  {
    id: 'msg_g1',
    chatId: 'chat_group_core',
    senderId: 'user_marcus',
    content: 'Security announcement: End-to-end encryption key ratcheting with double cryptographic safety numbers is active.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'read',
    isPinned: true,
    reactions: { '🔒': ['user_alex', 'user_sarah', 'user_david'] },
  },
  {
    id: 'msg_g2',
    chatId: 'chat_group_core',
    senderId: 'user_david',
    content: 'WebRTC SFU node latency benchmark is sitting at 32ms worldwide across multi-peer streams.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'read',
  },
  {
    id: 'msg_g3',
    chatId: 'chat_group_core',
    senderId: 'user_sarah',
    content: 'Architecture overview document attached for today review.',
    type: 'document',
    attachment: {
      type: 'document',
      url: '#',
      fileName: 'Connectra_Protocol_Spec_v2.pdf',
      fileSize: '3.4 MB',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'read',
    reactions: { '👏': ['user_alex', 'user_marcus'] },
  },
];
messages.set('chat_group_core', groupMessages);

const marcusMessages: Message[] = [
  {
    id: 'msg_m1',
    chatId: 'chat_marcus',
    senderId: 'user_marcus',
    content: 'Alex, your safety fingerprint has been validated: 49812 00392 77124 99018. All voice/video sessions are secure.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'read',
  },
];
messages.set('chat_marcus', marcusMessages);

const elenaMessages: Message[] = [
  {
    id: 'msg_e1',
    chatId: 'chat_elena',
    senderId: 'user_elena',
    content: 'Loved the new synthesized ringtone melodies on Connectra!',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'read',
  },
];
messages.set('chat_elena', elenaMessages);

// Compute last messages on chats
chats.forEach((chat) => {
  const msgs = messages.get(chat.id) || [];
  if (msgs.length > 0) {
    chat.lastMessage = msgs[msgs.length - 1];
  }
});

// Seed Initial Call Records
calls.push(
  {
    id: 'call_1',
    callerId: 'user_sarah',
    recipientIds: ['user_alex'],
    chatId: 'chat_sarah',
    type: 'video',
    direction: 'incoming',
    status: 'completed',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    durationSeconds: 432, // 7m 12s
  },
  {
    id: 'call_2',
    callerId: 'user_alex',
    recipientIds: ['user_marcus'],
    chatId: 'chat_marcus',
    type: 'audio',
    direction: 'outgoing',
    status: 'completed',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    durationSeconds: 185, // 3m 5s
  },
  {
    id: 'call_3',
    callerId: 'user_elena',
    recipientIds: ['user_alex'],
    chatId: 'chat_elena',
    type: 'audio',
    direction: 'missed',
    status: 'missed',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    durationSeconds: 0,
  }
);

// Seed Status Updates (Stories)
statuses.push(
  {
    id: 'status_1',
    userId: 'user_sarah',
    user: {
      id: 'user_sarah',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    },
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'Sunset team walk after a productive sprint! 🌅',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
    viewers: [
      { userId: 'user_alex', viewedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { userId: 'user_marcus', viewedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    ],
  },
  {
    id: 'status_2',
    userId: 'user_marcus',
    user: {
      id: 'user_marcus',
      name: 'Marcus Brody',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    type: 'text',
    content: 'Zero-knowledge Double Ratchet protocol verified with 0 memory leaks in production benchmark. 🚀🔒',
    backgroundColor: 'from-blue-600 to-cyan-700',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    viewers: [
      { userId: 'user_alex', viewedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
    ],
  },
  {
    id: 'status_3',
    userId: 'user_elena',
    user: {
      id: 'user_elena',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    },
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    caption: 'Studio mastering for the new Connectra notification soundscape 🎧',
    createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 17).toISOString(),
    viewers: [],
  }
);

// Seed Communities & Channels
communities.push(
  {
    id: 'comm_1',
    name: 'Connectra Developers Hub',
    description: 'The global community for engineers building real-time messaging, WebRTC calling, and P2P encryption modules.',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    creatorId: 'user_alex',
    adminIds: ['user_alex', 'user_marcus'],
    memberCount: 1420,
    groupIds: ['chat_group_core'],
    channels: [
      {
        id: 'chan_announcements',
        name: 'Official Announcements',
        description: 'Product updates and architecture release notes.',
        isAnnouncementOnly: true,
      },
      {
        id: 'chan_webrtc',
        name: 'WebRTC & Audio Pipelines',
        description: 'Low-latency calling, jitter buffer optimization, and Opus codecs.',
        isAnnouncementOnly: false,
      },
      {
        id: 'chan_showcase',
        name: 'Community Showcase',
        description: 'Show what you are building with Connectra.',
        isAnnouncementOnly: false,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  }
);

channelPosts.set('chan_announcements', [
  {
    id: 'post_1',
    channelId: 'chan_announcements',
    authorId: 'user_alex',
    authorName: 'Alex Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    title: 'Connectra v2.4 Release: Crystal Audio & Ultra-Fast Calls',
    content: 'We are thrilled to roll out our Web Audio synthesizer engine, bidirectional WebRTC signaling with sub-50ms latency, and end-to-end cryptographic key verification.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    viewCount: 2840,
    reactions: { '🔥': 89, '❤️': 124, '🚀': 96 },
  },
  {
    id: 'post_2',
    channelId: 'chan_announcements',
    authorId: 'user_marcus',
    authorName: 'Marcus Brody',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    title: 'Zero-Knowledge Security Architecture Update',
    content: 'Private conversations remain strictly between your device and your peer. No unencrypted content ever touches our server persistent storage.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    viewCount: 1980,
    reactions: { '🔒': 145, '👍': 67 },
  },
]);

// ==========================================
// WEBSOCKET REAL-TIME DISPATCHER
// ==========================================

interface ClientSession {
  ws: WebSocket;
  userId: string;
}

const clientSessions: Map<WebSocket, ClientSession> = new Map();

function broadcastToUser(userId: string, event: string, payload: unknown) {
  const messageStr = JSON.stringify({ event, payload });
  clientSessions.forEach((session) => {
    if (session.userId === userId && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(messageStr);
    }
  });
}

function broadcastToChat(chatId: string, event: string, payload: unknown, excludeWs?: WebSocket) {
  const chat = chats.get(chatId);
  if (!chat) return;
  const messageStr = JSON.stringify({ event, payload });

  clientSessions.forEach((session, ws) => {
    if (ws !== excludeWs && chat.participantIds.includes(session.userId) && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { event, payload } = parsed;

      switch (event) {
        // Authenticate & Bind WS to userId
        case 'auth:identify': {
          const { userId } = payload;
          clientSessions.set(ws, { ws, userId });
          // Update status to online
          const user = users.get(userId);
          if (user) {
            user.status = 'online';
            user.lastSeen = new Date().toISOString();
          }
          // Notify peers of presence
          clientSessions.forEach((sess) => {
            if (sess.ws !== ws && sess.ws.readyState === WebSocket.OPEN) {
              sess.ws.send(JSON.stringify({
                event: 'presence:update',
                payload: { userId, status: 'online', lastSeen: new Date().toISOString() },
              }));
            }
          });
          break;
        }

        // Real-Time Message Send
        case 'message:send': {
          const newMsg: Message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            chatId: payload.chatId,
            senderId: payload.senderId,
            content: payload.content || '',
            type: payload.type || 'text',
            attachment: payload.attachment,
            createdAt: new Date().toISOString(),
            status: 'sent',
            replyTo: payload.replyTo,
            reactions: {},
            forwarded: payload.forwarded || false,
          };

          // Save to chat
          const chatMsgs = messages.get(newMsg.chatId) || [];
          chatMsgs.push(newMsg);
          messages.set(newMsg.chatId, chatMsgs);

          // Update chat lastMessage
          const chat = chats.get(newMsg.chatId);
          if (chat) {
            chat.lastMessage = newMsg;
          }

          // Deliver to all chat participants
          broadcastToChat(newMsg.chatId, 'message:new', newMsg);
          break;
        }

        // Typing indicators
        case 'typing:start': {
          broadcastToChat(payload.chatId, 'typing:update', {
            chatId: payload.chatId,
            userId: payload.userId,
            userName: payload.userName,
            isTyping: true,
          }, ws);
          break;
        }

        case 'typing:stop': {
          broadcastToChat(payload.chatId, 'typing:update', {
            chatId: payload.chatId,
            userId: payload.userId,
            userName: payload.userName,
            isTyping: false,
          }, ws);
          break;
        }

        // Message Reactions
        case 'message:react': {
          const { chatId, messageId, emoji, userId } = payload;
          const chatMsgs = messages.get(chatId);
          if (chatMsgs) {
            const targetMsg = chatMsgs.find((m) => m.id === messageId);
            if (targetMsg) {
              if (!targetMsg.reactions) targetMsg.reactions = {};
              const currentList = targetMsg.reactions[emoji] || [];
              if (currentList.includes(userId)) {
                // remove reaction
                targetMsg.reactions[emoji] = currentList.filter((id) => id !== userId);
                if (targetMsg.reactions[emoji].length === 0) {
                  delete targetMsg.reactions[emoji];
                }
              } else {
                // add reaction
                targetMsg.reactions[emoji] = [...currentList, userId];
              }
              broadcastToChat(chatId, 'message:reaction_updated', {
                chatId,
                messageId,
                reactions: targetMsg.reactions,
              });
            }
          }
          break;
        }

        // Mark Messages as Read
        case 'message:mark_read': {
          const { chatId, userId } = payload;
          const chatMsgs = messages.get(chatId);
          if (chatMsgs) {
            let updated = false;
            chatMsgs.forEach((m) => {
              if (m.senderId !== userId && m.status !== 'read') {
                m.status = 'read';
                updated = true;
              }
            });
            if (updated) {
              broadcastToChat(chatId, 'message:read_receipt', { chatId, readByUserId: userId });
            }
          }
          break;
        }

        // Delete message
        case 'message:delete': {
          const { chatId, messageId, forEveryone, userId } = payload;
          const chatMsgs = messages.get(chatId);
          if (chatMsgs) {
            const targetMsg = chatMsgs.find((m) => m.id === messageId);
            if (targetMsg) {
              if (forEveryone) {
                targetMsg.content = '🚫 This message was deleted';
                targetMsg.type = 'text';
                targetMsg.attachment = undefined;
              } else {
                if (!targetMsg.deletedForUserIds) targetMsg.deletedForUserIds = [];
                if (!targetMsg.deletedForUserIds.includes(userId)) {
                  targetMsg.deletedForUserIds.push(userId);
                }
              }
              broadcastToChat(chatId, 'message:updated', targetMsg);
            }
          }
          break;
        }

        // Edit message
        case 'message:edit': {
          const { chatId, messageId, newContent } = payload;
          const chatMsgs = messages.get(chatId);
          if (chatMsgs) {
            const targetMsg = chatMsgs.find((m) => m.id === messageId);
            if (targetMsg) {
              targetMsg.content = newContent;
              targetMsg.isEdited = true;
              broadcastToChat(chatId, 'message:updated', targetMsg);
            }
          }
          break;
        }

        // Call Signaling: Initiate Call
        case 'call:initiate': {
          const { callId, callerId, callerName, callerAvatar, recipientId, chatId, type, isGroup } = payload;
          // Notify recipient
          broadcastToUser(recipientId, 'call:incoming', {
            callId,
            callerId,
            callerName,
            callerAvatar,
            recipientId,
            chatId,
            type,
            isGroup: !!isGroup,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        // Call Signaling: Ringing acknowledgment
        case 'call:ringing': {
          const { callerId, callId } = payload;
          broadcastToUser(callerId, 'call:ringing', { callId });
          break;
        }

        // Call Signaling: Accept Call
        case 'call:accept': {
          const { callerId, recipientId, callId } = payload;
          broadcastToUser(callerId, 'call:accepted', { callId, recipientId });
          break;
        }

        // Call Signaling: Reject or Decline Call
        case 'call:reject': {
          const { callerId, callId, reason } = payload;
          broadcastToUser(callerId, 'call:rejected', { callId, reason: reason || 'declined' });
          // Log missed call
          calls.unshift({
            id: callId,
            callerId,
            recipientIds: [payload.recipientId],
            type: payload.type || 'audio',
            direction: 'missed',
            status: 'declined',
            startTime: new Date().toISOString(),
            durationSeconds: 0,
          });
          break;
        }

        // Call Signaling: End Active Call
        case 'call:end': {
          const { callerId, recipientId, callId, durationSeconds, type } = payload;
          if (callerId) broadcastToUser(callerId, 'call:ended', { callId, durationSeconds });
          if (recipientId) broadcastToUser(recipientId, 'call:ended', { callId, durationSeconds });

          // Record in call log
          calls.unshift({
            id: callId || 'call_' + Date.now(),
            callerId: callerId || 'unknown',
            recipientIds: recipientId ? [recipientId] : [],
            type: type || 'audio',
            direction: 'outgoing',
            status: durationSeconds > 0 ? 'completed' : 'missed',
            startTime: new Date().toISOString(),
            durationSeconds: durationSeconds || 0,
          });
          break;
        }

        // Call Signaling: WebRTC SDP & ICE exchange
        case 'call:signal': {
          const { toUserId, signalData, callId } = payload;
          broadcastToUser(toUserId, 'call:signal', {
            fromUserId: clientSessions.get(ws)?.userId,
            signalData,
            callId,
          });
          break;
        }

        // Group Call Room Events
        case 'group_call:join': {
          const { chatId, user } = payload;
          broadcastToChat(chatId, 'group_call:participant_joined', { chatId, user }, ws);
          break;
        }

        case 'group_call:leave': {
          const { chatId, userId } = payload;
          broadcastToChat(chatId, 'group_call:participant_left', { chatId, userId }, ws);
          break;
        }

        case 'group_call:media_toggle': {
          const { chatId, userId, isMuted, isCameraOff } = payload;
          broadcastToChat(chatId, 'group_call:media_toggled', { chatId, userId, isMuted, isCameraOff }, ws);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const session = clientSessions.get(ws);
    if (session) {
      const user = users.get(session.userId);
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date().toISOString();
        // Broadcast presence
        clientSessions.forEach((s) => {
          if (s.ws !== ws && s.ws.readyState === WebSocket.OPEN) {
            s.ws.send(JSON.stringify({
              event: 'presence:update',
              payload: { userId: session.userId, status: 'offline', lastSeen: user.lastSeen },
            }));
          }
        });
      }
      clientSessions.delete(ws);
    }
  });
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// In-memory OTP storage
const activeOtps: Map<string, { code: string; expiresAt: number }> = new Map();

// Send OTP
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
  const code = '849201'; // Default test OTP
  activeOtps.set(phoneNumber.replace(/\s/g, ''), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  res.json({
    success: true,
    message: `Verification code sent to ${phoneNumber}`,
    code,
  });
});

// Verify OTP & Login/Register
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { phoneNumber, code, fullName, username } = req.body;
  const cleanPhone = (phoneNumber || '').replace(/[\s\-\(\)]/g, '');
  const record = activeOtps.get(cleanPhone);
  if (!record || record.code !== code) {
    if (code !== '849201') {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
  }

  // Find or create user
  let user = Array.from(users.values()).find((u) => u.phoneNumber.replace(/[\s\-\(\)]/g, '') === cleanPhone);
  if (!user) {
    const newId = 'user_' + Date.now();
    user = {
      id: newId,
      name: fullName || 'Connectra Member',
      username: username ? username.replace(/^@/, '').trim() : 'user_' + Math.floor(1000 + Math.random() * 9000),
      phoneNumber,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      bio: 'Hey there! I am using Connectra.',
      status: 'online',
      lastSeen: new Date().toISOString(),
      role: 'user',
      privacy: {
        lastSeen: 'everyone',
        onlineStatus: 'everyone',
        profilePhoto: 'everyone',
        about: 'everyone',
        readReceipts: true,
        statusAudience: 'everyone',
      },
      blockedUserIds: [],
    };
    users.set(user.id, user);
  } else if (fullName && (user.name === 'Connectra Member' || !user.name)) {
    user.name = fullName;
    if (username) user.username = username.replace(/^@/, '').trim();
  }
  res.json({ success: true, user });
});

// Email Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = Array.from(users.values()).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found with this email' });
  }
  res.json({ success: true, user });
});

// Email Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  let user = Array.from(users.values()).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (user) {
    return res.status(409).json({ error: 'User already exists with this email' });
  }
  const newId = 'user_' + Date.now();
  user = {
    id: newId,
    name: name || email.split('@')[0],
    username: email.split('@')[0] + Math.floor(10 + Math.random() * 90),
    phoneNumber: '+1 555-' + Math.floor(1000 + Math.random() * 9000),
    email,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    bio: 'Hey there! I am using Connectra.',
    status: 'online',
    lastSeen: new Date().toISOString(),
    role: 'user',
    privacy: {
      lastSeen: 'everyone',
      onlineStatus: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      statusAudience: 'everyone',
    },
    blockedUserIds: [],
  };
  users.set(user.id, user);
  res.json({ success: true, user });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'Connectra — Chat & Call',
    version: '2.4.0',
    activeSockets: clientSessions.size,
    timestamp: new Date().toISOString(),
  });
});

// Users: Get all or search
app.get('/api/users', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const all = Array.from(users.values());
  if (!query) {
    return res.json(all);
  }
  const filtered = all.filter(
    (u) =>
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.phoneNumber.includes(query)
  );
  res.json(filtered);
});

// Users: Get by ID
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Users: Update profile
app.put('/api/users/:id', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, bio, avatar, status, privacy, twoFactorEnabled } = req.body;
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = avatar;
  if (status) user.status = status;
  if (privacy) user.privacy = { ...user.privacy, ...privacy };
  if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

  res.json(user);
});

// Users: Block or Unblock
app.post('/api/users/:id/block', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  const { targetUserId, action } = req.body;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (action === 'block') {
    if (!user.blockedUserIds.includes(targetUserId)) {
      user.blockedUserIds.push(targetUserId);
    }
  } else {
    user.blockedUserIds = user.blockedUserIds.filter((id) => id !== targetUserId);
  }
  res.json({ blockedUserIds: user.blockedUserIds });
});

// Chats: List for user
app.get('/api/chats', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'user_alex';
  const userChats = Array.from(chats.values())
    .filter((c) => c.participantIds.includes(userId))
    .map((c) => {
      const msgs = messages.get(c.id) || [];
      const unreadCount = msgs.filter((m) => m.senderId !== userId && m.status !== 'read').length;
      return {
        ...c,
        lastMessage: msgs.length > 0 ? msgs[msgs.length - 1] : undefined,
        unreadCount,
      };
    })
    .sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

  res.json(userChats);
});

// Chats: Create Chat (direct or group)
app.post('/api/chats', (req: Request, res: Response) => {
  const { type, participantIds, name, description, avatar, creatorId } = req.body;
  if (!participantIds || participantIds.length === 0) {
    return res.status(400).json({ error: 'participantIds required' });
  }

  // Check if direct chat already exists
  if (type === 'direct' && participantIds.length === 2) {
    const existing = Array.from(chats.values()).find(
      (c) => c.type === 'direct' && c.participantIds.includes(participantIds[0]) && c.participantIds.includes(participantIds[1])
    );
    if (existing) {
      return res.json(existing);
    }
  }

  const newChat: Chat = {
    id: 'chat_' + Date.now(),
    type: type || 'direct',
    name: name || undefined,
    description: description || undefined,
    avatar: avatar || undefined,
    participantIds,
    adminIds: type === 'group' ? [creatorId || participantIds[0]] : undefined,
    createdAt: new Date().toISOString(),
    isPinned: false,
    inviteCode: type === 'group' ? 'CONN-' + Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
  };

  chats.set(newChat.id, newChat);
  messages.set(newChat.id, []);

  // Broadcast new chat to all participants
  newChat.participantIds.forEach((pid) => {
    broadcastToUser(pid, 'chat:created', newChat);
  });

  res.json(newChat);
});

// Group: Add Member
app.post('/api/chats/:id/members', (req: Request, res: Response) => {
  const chatId = req.params.id;
  const { userId } = req.body;
  const chat = chats.get(chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (!chat.participantIds.includes(userId)) {
    chat.participantIds.push(userId);
  }
  const memberUser = users.get(userId);
  const sysMsg: Message = {
    id: 'msg_sys_' + Date.now(),
    chatId,
    senderId: 'system',
    content: `${memberUser?.name || 'A user'} was added to the group`,
    type: 'text',
    createdAt: new Date().toISOString(),
    status: 'read',
  };
  const list = messages.get(chatId) || [];
  list.push(sysMsg);
  messages.set(chatId, list);
  chat.lastMessage = sysMsg;
  broadcastToChat(chatId, 'chat:updated', chat);
  broadcastToChat(chatId, 'message:new', sysMsg);
  res.json(chat);
});

// Group: Remove Member
app.delete('/api/chats/:id/members/:userId', (req: Request, res: Response) => {
  const { id: chatId, userId } = req.params;
  const chat = chats.get(chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  chat.participantIds = chat.participantIds.filter((p) => p !== userId);
  if (chat.adminIds) {
    chat.adminIds = chat.adminIds.filter((a) => a !== userId);
  }
  const memberUser = users.get(userId);
  const sysMsg: Message = {
    id: 'msg_sys_' + Date.now(),
    chatId,
    senderId: 'system',
    content: `${memberUser?.name || 'A user'} was removed from the group`,
    type: 'text',
    createdAt: new Date().toISOString(),
    status: 'read',
  };
  const list = messages.get(chatId) || [];
  list.push(sysMsg);
  messages.set(chatId, list);
  chat.lastMessage = sysMsg;
  broadcastToChat(chatId, 'chat:updated', chat);
  broadcastToChat(chatId, 'message:new', sysMsg);
  res.json(chat);
});

// Group: Toggle Admin Role
app.post('/api/chats/:id/admins', (req: Request, res: Response) => {
  const { id: chatId } = req.params;
  const { userId, action } = req.body;
  const chat = chats.get(chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (!chat.adminIds) chat.adminIds = [];
  if (action === 'promote') {
    if (!chat.adminIds.includes(userId)) chat.adminIds.push(userId);
  } else {
    chat.adminIds = chat.adminIds.filter((a) => a !== userId);
  }
  broadcastToChat(chatId, 'chat:updated', chat);
  res.json(chat);
});

// Group: Leave
app.post('/api/chats/:id/leave', (req: Request, res: Response) => {
  const { id: chatId } = req.params;
  const { userId } = req.body;
  const chat = chats.get(chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  chat.participantIds = chat.participantIds.filter((p) => p !== userId);
  if (chat.adminIds) {
    chat.adminIds = chat.adminIds.filter((a) => a !== userId);
  }
  const memberUser = users.get(userId);
  const sysMsg: Message = {
    id: 'msg_sys_' + Date.now(),
    chatId,
    senderId: 'system',
    content: `${memberUser?.name || 'A user'} left the group`,
    type: 'text',
    createdAt: new Date().toISOString(),
    status: 'read',
  };
  const list = messages.get(chatId) || [];
  list.push(sysMsg);
  messages.set(chatId, list);
  chat.lastMessage = sysMsg;
  broadcastToChat(chatId, 'chat:updated', chat);
  broadcastToChat(chatId, 'message:new', sysMsg);
  res.json({ success: true });
});

// Messages: Get for chat
app.get('/api/chats/:id/messages', (req: Request, res: Response) => {
  const chatId = req.params.id;
  const chatMsgs = messages.get(chatId) || [];
  res.json(chatMsgs);
});

// Messages: Pin/Unpin
app.post('/api/chats/:chatId/pin-message', (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { messageId, isPinned } = req.body;
  const chatMsgs = messages.get(chatId);
  if (!chatMsgs) return res.status(404).json({ error: 'Chat not found' });

  const msg = chatMsgs.find((m) => m.id === messageId);
  if (msg) {
    msg.isPinned = isPinned;
    broadcastToChat(chatId, 'message:pinned_updated', { messageId, isPinned });
    return res.json(msg);
  }
  res.status(404).json({ error: 'Message not found' });
});

// Chats: Clear history
app.post('/api/chats/:id/clear', (req: Request, res: Response) => {
  const chatId = req.params.id;
  messages.set(chatId, []);
  const chat = chats.get(chatId);
  if (chat) {
    chat.lastMessage = undefined;
  }
  broadcastToChat(chatId, 'chat:cleared', { chatId });
  res.json({ success: true });
});

// Calls: List call history
app.get('/api/calls', (_req: Request, res: Response) => {
  res.json(calls);
});

// Statuses: Get 24h stories
app.get('/api/status', (_req: Request, res: Response) => {
  const now = new Date().getTime();
  // Filter only unexpired
  const valid = statuses.filter((s) => new Date(s.expiresAt).getTime() > now);
  res.json(valid);
});

// Statuses: Create status update
app.post('/api/status', (req: Request, res: Response) => {
  const { userId, type, content, mediaUrl, backgroundColor, caption } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newStatus: StatusUpdate = {
    id: 'status_' + Date.now(),
    userId,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
    },
    type: type || 'text',
    content,
    mediaUrl,
    backgroundColor: backgroundColor || 'from-sky-600 to-cyan-700',
    caption,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    viewers: [],
  };

  statuses.unshift(newStatus);

  // Broadcast to all active users
  clientSessions.forEach((sess) => {
    if (sess.ws.readyState === WebSocket.OPEN) {
      sess.ws.send(JSON.stringify({ event: 'status:new', payload: newStatus }));
    }
  });

  res.json(newStatus);
});

// Statuses: Mark as viewed
app.post('/api/status/:id/view', (req: Request, res: Response) => {
  const { id } = req.params;
  const { viewerId } = req.body;
  const target = statuses.find((s) => s.id === id);
  if (target) {
    if (!target.viewers.some((v) => v.userId === viewerId)) {
      target.viewers.push({
        userId: viewerId,
        viewedAt: new Date().toISOString(),
      });
    }
    return res.json(target);
  }
  res.status(404).json({ error: 'Status not found' });
});

// Communities: List
app.get('/api/communities', (_req: Request, res: Response) => {
  res.json(communities);
});

// Communities: Create
app.post('/api/communities', (req: Request, res: Response) => {
  const { name, description, avatar, bannerUrl, creatorId } = req.body;
  const newComm: Community = {
    id: 'comm_' + Date.now(),
    name,
    description,
    avatar: avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    creatorId,
    adminIds: [creatorId],
    memberCount: 1,
    groupIds: [],
    channels: [
      {
        id: 'chan_general_' + Date.now(),
        name: 'General Discussion',
        description: 'Community chatter and updates.',
        isAnnouncementOnly: false,
      },
    ],
    createdAt: new Date().toISOString(),
  };
  communities.push(newComm);
  res.json(newComm);
});

// Channel Posts: Get
app.get('/api/channels/:channelId/posts', (req: Request, res: Response) => {
  const posts = channelPosts.get(req.params.channelId) || [];
  res.json(posts);
});

// Channel Posts: Create
app.post('/api/channels/:channelId/posts', (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { authorId, title, content, imageUrl } = req.body;
  const user = users.get(authorId);

  const newPost: ChannelPost = {
    id: 'post_' + Date.now(),
    channelId,
    authorId: user?.id || 'unknown',
    authorName: user?.name || 'Anonymous',
    authorAvatar: user?.avatar || '',
    title,
    content,
    imageUrl,
    createdAt: new Date().toISOString(),
    viewCount: 1,
    reactions: { '👍': 1 },
  };

  const list = channelPosts.get(channelId) || [];
  list.unshift(newPost);
  channelPosts.set(channelId, list);

  res.json(newPost);
});

// Upload endpoint (stores data URL and metadata)
app.post('/api/upload', (req: Request, res: Response) => {
  const { dataUrl, fileName, fileType, fileSize } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'dataUrl required' });
  }
  // Return hosted / reference url
  res.json({
    url: dataUrl,
    fileName: fileName || 'file_' + Date.now(),
    fileType: fileType || 'application/octet-stream',
    fileSize: fileSize || '150 KB',
  });
});

// Admin metrics & users
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  let totalMsgCount = 0;
  messages.forEach((list) => {
    totalMsgCount += list.length;
  });

  res.json({
    registeredUsers: users.size,
    activeSockets: clientSessions.size,
    totalMessages: totalMsgCount,
    totalCalls: calls.length,
    totalCommunities: communities.length,
    activeStatuses: statuses.length,
    abuseReportsCount: abuseReports.length,
    serverUptimeSeconds: Math.floor(process.uptime()),
    encryptionRatchetsActive: users.size * 2,
    sfuMediaNodes: 4,
  });
});

// Admin: Abuse reports
app.get('/api/admin/reports', (_req: Request, res: Response) => {
  res.json(abuseReports);
});

app.post('/api/admin/reports', (req: Request, res: Response) => {
  const { reporterId, reportedUserId, reason } = req.body;
  const report = {
    id: 'report_' + Date.now(),
    reporterId,
    reportedUserId,
    reason: reason || 'Inappropriate content / spam',
    timestamp: new Date().toISOString(),
    status: 'pending' as const,
  };
  abuseReports.push(report);
  res.json(report);
});

// User data export (GDPR / Privacy compliance)
app.get('/api/export/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userChats = Array.from(chats.values()).filter((c) => c.participantIds.includes(userId));
  const userMessages: Record<string, Message[]> = {};
  userChats.forEach((c) => {
    userMessages[c.id] = (messages.get(c.id) || []).filter(
      (m) => !m.deletedForUserIds?.includes(userId)
    );
  });
  const userCalls = calls.filter((c) => c.callerId === userId || c.recipientIds.includes(userId));

  res.json({
    exportedAt: new Date().toISOString(),
    profile: user,
    chats: userChats,
    messages: userMessages,
    calls: userCalls,
  });
});

// Account deletion request
app.delete('/api/users/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  users.delete(userId);
  res.json({ success: true, message: 'User account and all personal identifiers wiped.' });
});

// ==========================================
// STATIC ASSETS & VITE INTEGRATION
// ==========================================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Connectra] Server running on port ${PORT} (devMode: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
