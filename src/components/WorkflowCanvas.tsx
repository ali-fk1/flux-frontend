import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Grid, List, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "./PostCard";
import PostCreationPanel from "./PostCreationPanel";
import CalendarView from "./CalendarView";
import {
  deleteScheduledPost,
  getScheduledPosts,
  type ScheduledPost,
} from "@/services/api";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  content: string;
  media?: string;
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: "draft" | "scheduled" | "posted" | "failed";
}

interface WorkflowCanvasProps {
  initialPosts?: Post[];
}

function toUiPost(p: ScheduledPost): Post {
  return {
    id: p.id,
    content: p.content,
    media: p.mediaUrl ?? undefined,
    // Backend scheduled posts endpoint currently doesn't include platform metadata.
    // Scheduling in this UI is currently for X only, so we display it as X (twitter icon).
    platforms: ["twitter"],
    scheduledTime: new Date(p.scheduledAtUtc),
    status: "scheduled",
  };
}

const WorkflowCanvas = ({ initialPosts = [] }: WorkflowCanvasProps) => {
  const navigate = useNavigate();
  // Keep the full API object in state (including id/cursor identity fields).
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [view, setView] = useState<"canvas" | "calendar" | "list">("canvas");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const fetchFirstPage = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      // First request must be WITHOUT cursor
      const res = await getScheduledPosts({ size: 20 });
      setPosts(res.content);
      setCursor(res.nextCursor);
      setHasNext(res.hasNext);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) {
        return;
      }
      // Keep existing UI stable; just stop loading.
      console.error("Failed to load scheduled posts:", err);
      setHasNext(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [navigate]);

  const fetchNextPage = useCallback(async () => {
    if (fetchingRef.current) return;
    if (!hasNext) return;
    if (cursor == null) return;

    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await getScheduledPosts({ size: 20, cursor });
      setPosts((prev) => [...prev, ...res.content]);
      setCursor(res.nextCursor);
      setHasNext(res.hasNext);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) {
        return;
      }
      console.error("Failed to load more scheduled posts:", err);
      setHasNext(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [cursor, hasNext, navigate]);

  const resetAndRefetch = useCallback(() => {
    setPosts([]);
    setCursor(null);
    setHasNext(true);
    fetchFirstPage();
  }, [fetchFirstPage]);

  useEffect(() => {
    // Always show real scheduled posts when loading this page
    resetAndRefetch();
  }, [resetAndRefetch]);

  // Event-driven refetch (no polling)
  useEffect(() => {
    const handler = () => resetAndRefetch();
    window.addEventListener("scheduled-posts:changed", handler);
    return () => window.removeEventListener("scheduled-posts:changed", handler);
  }, [resetAndRefetch]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!hasNext) return;
        if (loading) return;
        fetchNextPage();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNext, loading]);

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsCreatingPost(true);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(toUiPost(post));
    setIsCreatingPost(true);
  };

  const handleSavePost = (post: Post) => {
    if (editingPost) {
      // Update existing post
      setPosts(posts.map((p) => (p.id === post.id ? post : p)));
    } else {
      // Add new post
      setPosts([...posts, { ...post, id: Date.now().toString() }]);
    }
    setIsCreatingPost(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteScheduledPost(postId);
      // Remove by immutable identity only.
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      window.dispatchEvent(new CustomEvent("scheduled-posts:changed"));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) {
        return;
      }
      console.error("Failed to delete post:", err);
    }
  };

  const handleDuplicatePost = (post: ScheduledPost) => {
    const newPost = {
      ...toUiPost(post),
      id: Date.now().toString(),
      status: "draft" as const,
    };
    setPosts((prev) => [
      ...prev,
      {
        id: newPost.id,
        content: newPost.content,
        scheduledAtUtc: newPost.scheduledTime.toISOString(),
        status: newPost.status,
        mediaUrl: newPost.media ?? null,
      },
    ]);
  };

  const handleReschedulePost = (postId: string, newTime: Date) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, scheduledAtUtc: newTime.toISOString() };
        }
        return post;
      }),
    );
  };

  const uiPosts = posts.map(toUiPost);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-semibold">Workflow Canvas</h2>
        <div className="flex items-center gap-4">
          <Tabs defaultValue="canvas" className="w-fit">
            <TabsList>
              <TabsTrigger
                value="canvas"
                onClick={() => setView("canvas")}
                className="flex items-center gap-2"
              >
                <Grid className="h-4 w-4" />
                Canvas
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                onClick={() => setView("calendar")}
                className="flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="list"
                onClick={() => setView("list")}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={handleCreatePost}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        </div>
      </div>

      {view === "canvas" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                className="touch-none"
              >
                <PostCard
                  post={post}
                  onEdit={() => handleEditPost(post)}
                  onDelete={() => handleDeletePost(post.id)}
                  onDuplicate={() => handleDuplicatePost(post)}
                  onReschedule={(newTime) =>
                    handleReschedulePost(post.id, newTime)
                  }
                />
              </motion.div>
            ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {loading && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading more…
            </div>
          )}
        </div>
      )}

      {view === "calendar" && (
        <CalendarView
          posts={uiPosts}
          onEditPost={(post) => {
            const matched = posts.find((p) => p.id === post.id);
            if (matched) handleEditPost(matched);
          }}
          onReschedulePost={handleReschedulePost}
          onCreatePost={handleCreatePost}
        />
      )}

      {view === "list" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col gap-4">
            {[...posts].sort(
              (a, b) =>
                new Date(a.scheduledAtUtc).getTime() -
                new Date(b.scheduledAtUtc).getTime(),
            )
              .map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PostCard
                    post={post}
                    onEdit={() => handleEditPost(post)}
                    onDelete={() => handleDeletePost(post.id)}
                    onDuplicate={() => handleDuplicatePost(post)}
                    onReschedule={(newTime) =>
                      handleReschedulePost(post.id, newTime)
                    }
                    isListView
                  />
                </motion.div>
              ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {loading && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading more…
            </div>
          )}
        </div>
      )}

      {isCreatingPost && (
        <PostCreationPanel
          isOpen={isCreatingPost}
          onClose={() => {
            setIsCreatingPost(false);
            setEditingPost(null);
          }}
          onSave={handleSavePost}
          initialPost={editingPost || undefined}
        />
      )}
    </div>
  );
};

export default WorkflowCanvas;
