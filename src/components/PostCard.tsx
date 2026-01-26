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

interface Post {
  id: string;
  content: string;
  media?: string;
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: "draft" | "scheduled" | "posted" | "failed";
}

export interface PostCardProps {
  post?: Post;
  onEdit?: (post: Post) => void;
  onDuplicate?: (post: Post) => void;
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
  const handleEdit = () => onEdit?.(post);
  const handleDuplicate = () => onDuplicate?.(post);
  const handleDelete = () => onDelete?.(post.id);
  const handleReschedule = () => onReschedule?.(new Date());

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
          className={`${isListView ? "w-full" : "w-[300px]"} bg-white border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <CardContent className="p-0">
            {/* Platform Icons */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="flex space-x-2">
                {post.platforms.map((platform, index) => (
                  <div
                    key={`${platform}-${index}`}
                    className="flex items-center"
                  >
                    {platformIcons[platform]}
                  </div>
                ))}
              </div>
              <Badge className={statusColors[post.status]}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </Badge>
            </div>

            {/* Content Preview */}
            <div className="p-3">
              {post.media ? (
                <div className="flex">
                  <div className="w-16 h-16 mr-3 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={post.media}
                      alt="Post media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {post.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Scheduled Time */}
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {post.scheduledTime.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end p-2 bg-gray-50 rounded-b-xl">
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
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
