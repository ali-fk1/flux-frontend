import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "./PostCard";
import PostCreationPanel from "./PostCreationPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  deleteScheduledPost,
  getScheduledPosts,
  type ScheduledPost,
} from "@/services/api";
import { FileText } from "lucide-react";

interface Post {
  id: string;
  content: string;
  media?: string;
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: string;
}

interface WorkflowCanvasProps {
  initialPosts?: Post[];
}

function toUiPost(p: ScheduledPost): Post {
  return {
    id: p.id,
    content: p.content,
    media: p.mediaUrl ?? undefined,
    platforms: ["twitter"],
    scheduledTime: new Date(p.scheduledAtUtc),
    status: p.status || "scheduled",
  };
}

function PostCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

const WorkflowCanvas = ({ initialPosts = [] }: WorkflowCanvasProps) => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [view, setView] = useState<"canvas" | "list">("canvas");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const fetchFirstPage = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getScheduledPosts({ size: 20 });
      setPosts(res.content);
      setCursor(res.nextCursor);
      setHasNext(res.hasNext);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) return;
      setError("Couldn't load scheduled posts. Try again.");
      setHasNext(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

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
      if (err?.status === 401) return;
      setError("Couldn't load more posts. Try again.");
      setHasNext(false);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [cursor, hasNext]);

  const resetAndRefetch = useCallback(() => {
    setPosts([]);
    setCursor(null);
    setHasNext(true);
    setError(null);
    fetchFirstPage();
  }, [fetchFirstPage]);

  useEffect(() => {
    resetAndRefetch();
  }, [resetAndRefetch]);

  useEffect(() => {
    const handler = () => resetAndRefetch();
    window.addEventListener("scheduled-posts:changed", handler);
    return () => window.removeEventListener("scheduled-posts:changed", handler);
  }, [resetAndRefetch]);

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

  const handleSavePost = (post: {
    id: string;
    content: string;
    scheduledTime: Date;
    status: string;
    media?: unknown;
  }) => {
    if (editingPost) {
      setPosts(posts.map((p) => (p.id === post.id ? { ...p, content: post.content } : p)));
    } else {
      setPosts([
        ...posts,
        {
          id: Date.now().toString(),
          content: post.content,
          scheduledAtUtc: post.scheduledTime.toISOString(),
          status: post.status,
          mediaUrl: null,
        },
      ]);
    }
    setIsCreatingPost(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteScheduledPost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      window.dispatchEvent(new CustomEvent("scheduled-posts:changed"));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) return;
      setError("Couldn't delete this post. Try again.");
    }
  };

  const handleDuplicatePost = (post: ScheduledPost) => {
    const newPost = toUiPost(post);
    setPosts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: newPost.content,
        scheduledAtUtc: newPost.scheduledTime.toISOString(),
        status: "draft",
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
      })
    );
  };

  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(a.scheduledAtUtc).getTime() -
      new Date(b.scheduledAtUtc).getTime()
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "canvas" | "list")}
          className="w-fit"
        >
          <TabsList>
            <TabsTrigger value="canvas" className="gap-2">
              <Grid className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={handleCreatePost} className="gap-2">
          <Plus className="h-4 w-4" />
          Create post
        </Button>
      </div>

      {error && (
        <div
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
          <Button
            variant="link"
            size="sm"
            className="ml-2 h-auto p-0 text-destructive"
            onClick={resetAndRefetch}
          >
            Retry
          </Button>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No scheduled posts yet"
          description="Create your first post to get started."
          action={
            <Button onClick={handleCreatePost} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create post
            </Button>
          }
        />
      ) : (
        <div className="flex-1 overflow-auto">
          <div
            className={
              view === "canvas"
                ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {sortedPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <PostCard
                  post={post}
                  onEdit={() => handleEditPost(post)}
                  onDelete={() => handleDeletePost(post.id)}
                  onDuplicate={() => handleDuplicatePost(post)}
                  onReschedule={(newTime) =>
                    handleReschedulePost(post.id, newTime)
                  }
                  isListView={view === "list"}
                />
              </motion.div>
            ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {loading && posts.length > 0 && (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Loading more…
            </p>
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
          initialPost={
            editingPost
              ? {
                  ...editingPost,
                  status: (editingPost.status === "draft" ||
                  editingPost.status === "scheduled" ||
                  editingPost.status === "posted" ||
                  editingPost.status === "failed"
                    ? editingPost.status
                    : "scheduled") as "draft" | "scheduled" | "posted" | "failed",
                  media: [],
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

export default WorkflowCanvas;
