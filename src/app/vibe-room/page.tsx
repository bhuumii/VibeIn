"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"
import { CITIES } from "@/lib/constants"
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";

const CATEGORIES = ["Music", "Comedy", "Fun Activities", "Workshops", "Arts & Crafts", "Theatre", "Kids"];

export default function VibeRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [activeGroupChat, setActiveGroupChat] = useState<any>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // City states
  const [userCity, setUserCity] = useState("Delhi");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState("Music");
  const [postMessage, setPostMessage] = useState("");
  const [posting, setPosting] = useState(false);

  // Category dropdown
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [catBtnRect, setCatBtnRect] = useState<DOMRect | null>(null);
  const catBtnRef = useRef<HTMLButtonElement>(null);

  // 1. Initial Load and Auth
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login?redirect=/vibe-room");
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
      const city = profileData?.city || "Delhi";
      setUserCity(city);
      setAuthorized(true);

      await Promise.all([loadPosts(city), loadReactions()]);
      setLoading(false);
    });
  }, [router]);

  // 2. Global Real-time Listener
  useEffect(() => {
    if (!authorized) return;
    const channel = supabase.channel("vibe-global-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "vibe_posts" }, () => loadPosts(userCity))
      .on("postgres_changes", { event: "*", schema: "public", table: "vibe_reactions" }, () => loadReactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized, userCity]);

  // 3. Chat Real-time Listener
  useEffect(() => {
    if (!activeGroupChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("vibe_messages")
        .select(`*, profiles!sender_id (full_name, avatar_url)`)
        .eq("post_id", activeGroupChat.id)
        .order("created_at", { ascending: true });
      setGroupMessages(data || []);
    };
    fetchMessages();

    const chatChannel = supabase.channel(`chat_${activeGroupChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'vibe_messages', filter: `post_id=eq.${activeGroupChat.id}`
      }, async (payload) => {
        if (payload.new.sender_id !== user.id) {
          const { data: msgWithProfile } = await supabase
            .from("vibe_messages")
            .select("*, profiles!sender_id(full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (msgWithProfile) setGroupMessages(prev => [...prev, msgWithProfile]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(chatChannel); };
  }, [activeGroupChat?.id, user?.id]);

  const loadPosts = async (city: string) => {
    const { data } = await supabase
      .from("vibe_posts")
      .select("*, profiles!user_id(full_name, avatar_url, username)")
      .ilike("city", city.trim())
      .order("created_at", { ascending: false });
    setPosts(data || []);
  };

  const loadReactions = async () => {
    const { data } = await supabase.from("vibe_reactions").select("*");
    setReactions(data || []);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    const dataObj = {
      event_title: eventTitle,
      event_date: eventDate,
      event_time: eventTime,
      event_location: eventLocation,
      event_category: eventCategory,
      message: postMessage,
      city: userCity,
      user_id: user.id
    };

    let error = null;

    if (editingPost) {
      const res = await supabase.from("vibe_posts").update(dataObj).eq("id", editingPost.id);
      error = res.error;
    } else {
      const res = await supabase.from("vibe_posts").insert(dataObj);
      error = res.error;
    }

    if (error) {
      console.error("Post error:", error);
      toast.error("Failed to post vibe: " + error.message);
      setPosting(false);
      return;
    }

    setShowForm(false);
    setEditingPost(null);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setEventCategory("Music");
    setPostMessage("");
    setPosting(false);
    await loadPosts(userCity);
    toast.success(editingPost ? "Vibe updated!" : "Vibe posted!");
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setEventTitle(post.event_title);
    setEventDate(post.event_date || "");
    setEventTime(post.event_time || "");
    setEventLocation(post.event_location || "");
    setEventCategory(post.event_category || "Music");
    setPostMessage(post.message || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this vibe?")) return;
    await supabase.from("vibe_posts").delete().eq("id", postId);
    loadPosts(userCity);
  };

  const handleReaction = async (postId: string, type: 'like' | 'dislike') => {
    const existing = reactions.find(r => r.post_id === postId && r.user_id === user.id);
    if (existing) {
      if (existing.type === type) {
        await supabase.from("vibe_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("vibe_reactions").update({ type }).eq("id", existing.id);
      }
    } else {
      await supabase.from("vibe_reactions").insert({ post_id: postId, user_id: user.id, type });
    }
    loadReactions();
  };

  const openGroupChat = (post: any) => {
    const userReaction = reactions.find(r => r.post_id === post.id && r.user_id === user.id);
    const isAllowed = post.user_id === user.id || userReaction?.type === 'like';
    if (!isAllowed) {
      toast.info("Click 'Interested' (👍) to join the group chat!", {
        duration: 3000,
      });
      return;
    }
    setActiveGroupChat(post);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeGroupChat) return;
    const content = newMessage.trim();
    setNewMessage("");

    const tempMsg = {
      id: Date.now(),
      message: content,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile?.full_name || "You", avatar_url: profile?.avatar_url }
    };
    setGroupMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase.from("vibe_messages").insert({
      post_id: activeGroupChat.id,
      sender_id: user.id,
      message: content,
    });

    if (error) {
      setGroupMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleCatDropToggle = () => {
    if (!showCatDrop && catBtnRef.current) setCatBtnRect(catBtnRef.current.getBoundingClientRect());
    setShowCatDrop(!showCatDrop);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages]);

  const getInitials = (name: string) => (name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return <div className="min-h-screen bg-[#0f0a24] flex items-center justify-center text-white">Loading...</div>;

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] text-white px-6 py-8 overflow-x-hidden">
      <div className={`relative z-10 max-w-3xl mx-auto transition-all duration-300 ${activeGroupChat ? "mr-96" : ""}`}>
        <Breadcrumb crumbs={[
          { label: "Home", href: "/" },
          { label: "Vibe with Strangers" }
        ]} />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Vibe with Strangers</h1>
            <div className="text-zinc-400 mt-1 flex items-center gap-1">
              Events in{" "}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="text-purple-400 hover:text-purple-300 font-bold underline decoration-dotted underline-offset-4 flex items-center gap-1 transition-all"
                >
                  {userCity}
                  <span className={`text-[10px] transition-transform ${showCityDropdown ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {showCityDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
                      {CITIES.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setUserCity(city);
                            loadPosts(city);
                            setShowCityDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                            userCity === city ? "bg-purple-600 text-white" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => { setEditingPost(null); setShowForm(!showForm); }}
            className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold transition"
          >
            {showForm ? "Cancel" : "+ Post a Vibe"}
          </button>
        </div>

        {/* Post Form */}
        {showForm && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-purple-300">
              {editingPost ? "✏️ Edit Vibe" : "📣 Create a Vibe Post"}
            </h2>
            <form onSubmit={handlePost} className="space-y-4">

              {/* Title */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Event Name *</label>
                <input
                  type="text" value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  required placeholder="e.g. Poetry Open Mic Night"
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-400 outline-none transition placeholder-zinc-600"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Date</label>
                  <input
                    type="date" value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-400 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Time</label>
                  <input
                    type="time" value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-400 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Venue / Location *</label>
                <input
                  type="text" value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  required placeholder="e.g. The Piano Man Jazz Club, Delhi"
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-400 transition placeholder-zinc-600"
                />
              </div>

              {/* City + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">City</label>
                  <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm">
                    📍 {userCity} <span className="text-zinc-600 text-xs">(from your profile)</span>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Category</label>
                  <button
                    type="button" ref={catBtnRef}
                    onClick={handleCatDropToggle}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white hover:border-purple-400 transition font-medium"
                  >
                    <span>🏷️ {eventCategory}</span>
                    <span className={`text-[10px] transition-transform ${showCatDrop ? "rotate-180" : ""}`}>▼</span>
                  </button>
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Details / Description</label>
                <textarea
                  value={postMessage}
                  onChange={e => setPostMessage(e.target.value)}
                  placeholder="Tell people what this event is about..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none resize-none focus:border-purple-400 transition placeholder-zinc-600"
                />
              </div>

              <button
                type="submit" disabled={posting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 font-bold transition disabled:opacity-50"
              >
                {posting ? "Saving..." : editingPost ? "Update Vibe ✅" : "Post Vibe 🚀"}
              </button>
            </form>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-6 pb-20">
          {posts.length === 0 ? (
            <div className="bg-white/5 border border-purple-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center backdrop-blur-xl">
              <div className="text-5xl mb-6">✨</div>
              <h3 className="text-2xl font-bold text-white mb-2">No vibes yet in {userCity}</h3>
              <p className="text-zinc-400 mb-8 max-w-xs mx-auto text-sm">Be the first one to start the party! Post a vibe and find people to join you.</p>
              <button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-xl font-bold transition">Create First Vibe 🚀</button>
            </div>
          ) : (
            posts.map((post) => {
              const postLikes = reactions.filter(r => r.post_id === post.id && r.type === 'like');
              const postDislikes = reactions.filter(r => r.post_id === post.id && r.type === 'dislike');
              const userReaction = reactions.find(r => r.post_id === post.id && r.user_id === user.id);
              const isOwner = post.user_id === user?.id;

              return (
                <div key={post.id} className={`bg-white/5 border rounded-3xl p-6 transition-all ${activeGroupChat?.id === post.id ? "border-purple-500 bg-white/10" : "border-white/10 hover:border-white/20"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-purple-400/30">
                        {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="text-zinc-500 font-bold">{getInitials(post.profiles?.full_name)}</span>}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{post.profiles?.full_name || "User"}</h4>
                        <p className="text-zinc-500 text-xs">@{post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(post)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition">Edit</button>
                        <button onClick={() => handleDelete(post.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm transition">Delete</button>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-white">🎉 {post.event_title}</h3>
                      {post.event_category && (
                        <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">
                          {post.event_category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-zinc-400 text-sm mb-3">
                      {post.event_date && <span>📅 {post.event_date}</span>}
                      {post.event_time && <span>🕐 {post.event_time}</span>}
                      {post.event_location && <span>📍 {post.event_location}</span>}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{post.message}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleReaction(post.id, 'like')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition ${userReaction?.type === 'like' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                        👍 {postLikes.length}
                      </button>
                      <button onClick={() => handleReaction(post.id, 'dislike')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition ${userReaction?.type === 'dislike' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                        👎 {postDislikes.length}
                      </button>
                      <span className="text-zinc-500 text-sm ml-2">{postLikes.length} interested</span>
                    </div>
                    <button onClick={() => openGroupChat(post)} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition">💬 Chat</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT PANEL */}
      {activeGroupChat && (
        <div className="fixed top-0 right-0 h-full w-[380px] bg-[#0a051a] border-l border-white/10 flex flex-col z-[100] shadow-2xl animate-in slide-in-from-right">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div>
              <h3 className="font-bold text-lg truncate w-64">{activeGroupChat.event_title}</h3>
              <p className="text-purple-400 text-xs font-semibold">Group Chat</p>
            </div>
            <button onClick={() => setActiveGroupChat(null)} className="p-2 hover:bg-white/10 rounded-full transition">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {groupMessages.length === 0 && <p className="text-center text-zinc-600 mt-10">No messages yet. Say hi!</p>}
            {groupMessages.map((msg, i) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id || i} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-purple-500/30">
                    {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[10px]">{getInitials(msg.profiles?.full_name)}</span>}
                  </div>
                  <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-white/10 text-zinc-200 rounded-tl-none"}`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Message..." className="flex-1 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm focus:border-purple-500 outline-none transition" />
              <button onClick={sendMessage} className="bg-purple-600 hover:bg-purple-500 px-5 rounded-2xl transition font-bold">→</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Dropdown */}
      {showCatDrop && catBtnRect && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowCatDrop(false)} />
          <div
            className="fixed z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ top: catBtnRect.bottom + 8, left: catBtnRect.left, width: catBtnRect.width }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat} type="button"
                onClick={() => { setEventCategory(cat); setShowCatDrop(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${eventCategory === cat ? "bg-purple-600 text-white" : "hover:bg-white/10 text-zinc-300"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}