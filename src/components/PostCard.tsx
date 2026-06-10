import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Twitter,
  Edit,
  Copy,
  Trash2,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/services/api";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface Post {
  id: string;
  content: string;
  media?: string;
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: string;
}

type PostCardPost = Post | ScheduledPost;

export interface PostCardProps {
  post?: PostCardPost;
  onEdit?: (post: PostCardPost) => void;
  onDuplicate?: (post: PostCardPost) => void;
  onDelete?: (id: string) => void;
  onReschedule?: (newTime: Date) => void;
  isListView?: boolean;
}

const platformIcons = {
  twitter: <Twitter className="h-4 w-4 text-foreground" aria-hidden="true" />,
};

const PostCard: React.FC<PostCardProps> = ({
  post = {
    id: "post-1",
    content: "Check out our latest product launch!",
    platforms: ["twitter"],
    scheduledTime: new Date(),
    status: "scheduled",
  },
  onEdit,
  onDuplicate,
  onDelete,
  onReschedule,
  isListView = false,
}) => {
  const isApiScheduledPost = "scheduledAtUtc" in post;
  const postId = post.id;
  const postContent = post.content;
  const postMedia = isApiScheduledPost ? post.mediaUrl ?? undefined : post.media;
  const postStatus = post.status || "scheduled";
  const postScheduledTime = isApiScheduledPost
    ? new Date(post.scheduledAtUtc)
    : post.scheduledTime;

  const scheduledLabel = postScheduledTime.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleEdit = () => onEdit?.(post);
  const handleDuplicate = () => onDuplicate?.(post);
  const handleDelete = () => onDelete?.(postId);
  const handleReschedule = () => onReschedule?.(new Date());

  const actionButtons = (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
            aria-label="Edit post"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Edit post</p></TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            className="h-8 w-8 p-0"
            aria-label="Duplicate post"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Duplicate post</p></TooltipContent>
      </Tooltip>
      {!isListView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReschedule}
              className="h-8 w-8 p-0"
              aria-label="Reschedule post"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Reschedule post</p></TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Delete post</p></TooltipContent>
      </Tooltip>
    </div>
  );

  if (isListView) {
    const hasMedia = !!postMedia;
    return (
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Card className="w-full border border-border bg-card transition-colors hover:bg-secondary/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{scheduledLabel}</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {hasMedia ? (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={postMedia}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      {platformIcons.twitter}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {platformIcons.twitter}
                      <StatusBadge status={postStatus} />
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground">
                      {postContent}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">{actionButtons}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          className={cn(
            "w-full overflow-hidden border border-border bg-card transition-colors hover:border-primary/30 hover:bg-secondary/20"
          )}
        >
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                {platformIcons.twitter}
                <span className="text-xs text-muted-foreground">X</span>
              </div>
              <StatusBadge status={postStatus} />
            </div>

            <div className="p-3">
              {postMedia ? (
                <div className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                    <img
                      src={postMedia}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                    {postContent}
                  </p>
                </div>
              ) : (
                <p className="line-clamp-4 text-sm leading-relaxed text-foreground">
                  {postContent}
                </p>
              )}

              <div className="mt-3 flex items-center font-mono text-xs text-muted-foreground tabular-nums">
                <Calendar className="mr-1.5 h-3 w-3" aria-hidden="true" />
                {scheduledLabel}
              </div>
            </div>

            <div className="flex justify-end border-t border-border bg-muted/20 px-2 py-1.5">
              {actionButtons}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default PostCard;
