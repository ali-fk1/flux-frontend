import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Grid, List, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "./PostCard";
import PostCreationPanel from "./PostCreationPanel";
import CalendarView from "./CalendarView";

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

const WorkflowCanvas = ({ initialPosts = [] }: WorkflowCanvasProps) => {
  const [posts, setPosts] = useState<Post[]>(
    initialPosts.length > 0
      ? initialPosts
      : [
          {
            id: "1",
            content: "Check out our new product launch! #innovation",
            media:
              "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&q=80",
            platforms: ["instagram", "twitter"],
            scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
            status: "scheduled",
          },
          {
            id: "2",
            content: "Join us for a webinar on digital marketing strategies",
            media:
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80",
            platforms: ["linkedin"],
            scheduledTime: new Date(Date.now() + 172800000), // Day after tomorrow
            status: "draft",
          },
          {
            id: "3",
            content:
              "We're hiring! Check out our careers page for more information.",
            platforms: ["linkedin", "twitter"],
            scheduledTime: new Date(Date.now() + 259200000), // 3 days from now
            status: "draft",
          },
        ],
  );

  const [view, setView] = useState<"canvas" | "calendar" | "list">("canvas");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsCreatingPost(true);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
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

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handleDuplicatePost = (post: Post) => {
    const newPost = {
      ...post,
      id: Date.now().toString(),
      status: "draft" as const,
    };
    setPosts([...posts, newPost]);
  };

  const handleReschedulePost = (postId: string, newTime: Date) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return { ...post, scheduledTime: newTime };
        }
        return post;
      }),
    );
  };

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
        </div>
      )}

      {view === "calendar" && (
        <CalendarView
          posts={posts}
          onEditPost={handleEditPost}
          onReschedulePost={handleReschedulePost}
          onCreatePost={handleCreatePost}
        />
      )}

      {view === "list" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col gap-4">
            {posts
              .sort(
                (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime(),
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
