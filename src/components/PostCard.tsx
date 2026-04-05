import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Instagram,
  Twitter,
  Linkedin,
  Edit,
  Copy,
  Trash2,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/services/api";

interface Post {
  id: string;
  content: string;
  media?: string;
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: "draft" | "scheduled" | "posted" | "failed";
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

const statusColors = {
  draft: "bg-gray-200 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  posted: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const platformIcons = {
  instagram: <Instagram className="h-5 w-5 text-[#E1306C]" />,
  twitter: <Twitter className="h-5 w-5 text-[#1DA1F2]" />,
  linkedin: <Linkedin className="h-5 w-5 text-[#0077B5]" />,
};

const platformLabels: Record<Post["platforms"][number], string> = {
  instagram: "Instagram",
  twitter: "X",
  linkedin: "LinkedIn",
};

const PostCard: React.FC<PostCardProps> = ({
  post = {
    id: "post-1",
    content: "Check out our latest product launch! #exciting #newproduct",
    media:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
    platforms: ["instagram", "twitter"],
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
  const postStatus = (post.status || "scheduled") as Post["status"];
  const postScheduledTime = isApiScheduledPost
    ? new Date(post.scheduledAtUtc)
    : post.scheduledTime;
  const postPlatforms = isApiScheduledPost
    ? (["twitter"] as const)
    : (post.platforms.length > 0 ? post.platforms : (["twitter"] as const));

  const handleEdit = () => onEdit?.(post);
  const handleDuplicate = () => onDuplicate?.(post);
  const handleDelete = () => onDelete?.(postId);
  const handleReschedule = () => onReschedule?.(new Date());

  const statusLabel =
    postStatus.charAt(0).toUpperCase() + postStatus.slice(1);
  const scheduledLabel = postScheduledTime.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const platformsForDisplay = postPlatforms;

  if (isListView) {
    const hasMedia = !!postMedia;
    return (
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Card className="w-full border border-border/50 bg-card shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0 text-xs sm:text-sm text-muted-foreground tabular-nums flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{scheduledLabel}</span>
                </div>

                <div className="min-w-0 flex-1 flex items-center gap-3">
                  {hasMedia ? (
                    <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={postMedia}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-border/40" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {platformsForDisplay.map((platform, idx) => (
                          <div
                            key={`${platform}-${idx}`}
                            className="flex items-center"
                            title={platformLabels[platform]}
                          >
                            {platformIcons[platform]}
                          </div>
                        ))}
                      </div>
                      <Badge className={statusColors[postStatus]}>
                        {statusLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground">
                      {postContent}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit post</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDuplicate}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duplicate post</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete post</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
        drag={!isListView}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        whileDrag={{ scale: 1.05, zIndex: 10 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={isListView ? "" : "cursor-grab active:cursor-grabbing"}
      >
        <Card
          className={cn(
            "w-[300px] overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
          )}
        >
          <CardContent className="p-0">
            {/* Platform Icons */}
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                {platformsForDisplay.map((platform, index) => (
                  <div
                    key={`${platform}-${index}`}
                    className="flex items-center"
                    title={platformLabels[platform]}
                  >
                    {platformIcons[platform]}
                  </div>
                ))}
              </div>
              <Badge className={statusColors[postStatus]}>
                {statusLabel}
              </Badge>
            </div>

            {/* Content Preview */}
            <div className="p-3">
              {postMedia ? (
                <div className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={postMedia}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                    {postContent}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border/40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 px-4 py-5">
                  <p className="text-center text-base font-semibold leading-snug text-foreground line-clamp-4">
                    {postContent}
                  </p>
                </div>
              )}

              {/* Scheduled Time */}
              <div className="mt-3 text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {scheduledLabel}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end p-2 bg-muted/30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit post</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDuplicate}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate post</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReschedule}
                    className="h-8 w-8 p-0"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reschedule post</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete post</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default PostCard;
