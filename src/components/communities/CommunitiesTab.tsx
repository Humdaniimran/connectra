import React, { useState, useEffect } from 'react';
import { Community, ChannelPost } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../common/Avatar.tsx';
import {
  Users,
  Radio,
  Plus,
  Eye,
  Heart,
  Flame,
  Rocket,
  Send,
  MessageSquare,
  Sparkles,
  X,
  Share2,
} from 'lucide-react';

export const CommunitiesTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>('chan_announcements');
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // New post state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');

  // New community state
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');

  const loadCommunities = async () => {
    try {
      const list = await api.getCommunities();
      setCommunities(list);
      if (list.length > 0 && !activeCommunity) {
        setActiveCommunity(list[0]);
      }
    } catch (e) {
      console.error('Failed to load communities:', e);
    }
  };

  const loadChannelPosts = async (channelId: string) => {
    try {
      const channelPosts = await api.getChannelPosts(channelId);
      setPosts(channelPosts);
    } catch (e) {
      console.error('Failed to load channel posts:', e);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      loadChannelPosts(activeChannelId);
    }
  }, [activeChannelId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !postContent.trim()) return;

    try {
      const newPost = await api.createChannelPost({
        channelId: activeChannelId,
        authorId: currentUser.id,
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
      });
      setPosts((prev) => [newPost, ...prev]);
      setPostTitle('');
      setPostContent('');
      setShowNewPostModal(false);
    } catch (e) {
      console.error('Failed to create post:', e);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commName.trim()) return;

    try {
      const newComm = await api.createCommunity({
        name: commName.trim(),
        description: commDesc.trim(),
        creatorId: currentUser.id,
      });
      setCommunities((prev) => [...prev, newComm]);
      setActiveCommunity(newComm);
      setCommName('');
      setCommDesc('');
      setShowCreateCommunity(false);
    } catch (e) {
      console.error('Failed to create community:', e);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-900/90 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
        <h2 className="text-base font-bold text-white tracking-tight">Communities & Channels</h2>
        <button
          onClick={() => setShowCreateCommunity(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition-colors"
          title="Create New Community"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Selected Community Header & Banner */}
        {activeCommunity && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg">
            <div className="relative h-28 w-full bg-slate-900">
              <img
                src={activeCommunity.bannerUrl}
                alt={activeCommunity.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>

            <div className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="-mt-10 rounded-2xl ring-4 ring-slate-950 overflow-hidden shadow-xl">
                    <Avatar src={activeCommunity.avatar} name={activeCommunity.name} size="lg" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {activeCommunity.name}
                    </h3>
                    <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                      {activeCommunity.memberCount} members
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-cyan-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Post Update</span>
                </button>
              </div>

              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                {activeCommunity.description}
              </p>

              {/* Channels List */}
              <div className="mt-4 flex flex-wrap gap-2">
                {activeCommunity.channels.map((chan) => (
                  <button
                    key={chan.id}
                    onClick={() => setActiveChannelId(chan.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeChannelId === chan.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Radio className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{chan.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Channel Broadcast Posts Feed */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-3 flex items-center justify-between">
            <span>Broadcast Feed</span>
            <span className="text-cyan-400 font-mono lowercase">{posts.length} updates</span>
          </div>

          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-500">
                No broadcast posts published in this channel yet.
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-white">{post.authorName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{post.viewCount}</span>
                    </div>
                  </div>

                  {post.title && (
                    <h4 className="text-sm font-bold text-slate-100">{post.title}</h4>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={post.imageUrl}
                        alt="Post media"
                        referrerPolicy="no-referrer"
                        className="max-h-64 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Reaction chips */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        post.reactions['🔥'] = (post.reactions['🔥'] || 0) + 1;
                        setPosts([...posts]);
                      }}
                      className="flex items-center gap-1 rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500"
                    >
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-mono text-[10px]">{post.reactions['🔥'] || 0}</span>
                    </button>
                    <button
                      onClick={() => {
                        post.reactions['❤️'] = (post.reactions['❤️'] || 0) + 1;
                        setPosts([...posts]);
                      }}
                      className="flex items-center gap-1 rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500"
                    >
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      <span className="font-mono text-[10px]">{post.reactions['❤️'] || 0}</span>
                    </button>
                    <button
                      onClick={() => {
                        post.reactions['🚀'] = (post.reactions['🚀'] || 0) + 1;
                        setPosts([...posts]);
                      }}
                      className="flex items-center gap-1 rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500"
                    >
                      <Rocket className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="font-mono text-[10px]">{post.reactions['🚀'] || 0}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: New Broadcast Post */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-semibold text-white">Broadcast Announcement</span>
              <button onClick={() => setShowNewPostModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Headline (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Protocol v2.5 Architecture Announcement"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Message Content</label>
                <textarea
                  placeholder="Write message to channel subscribers..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Publish to Channel</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Community */}
      {showCreateCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-semibold text-white">Create New Community</span>
              <button onClick={() => setShowCreateCommunity(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCommunity} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Community Name</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed WebRTC Pioneers"
                  value={commName}
                  onChange={(e) => setCommName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="What is this community about? Who should join?"
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Create Community</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
