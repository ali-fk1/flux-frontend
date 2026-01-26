import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Twitter,
  Linkedin,
  MoreHorizontal,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

interface Post {
  id: string;
  content: string;
  media?: string;
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: "draft" | "scheduled" | "posted" | "failed";
}

interface CalendarViewProps {
  posts?: Post[];
  onCreatePost?: () => void;
  onEditPost?: (post: Post) => void;
  onReschedulePost?: (postId: string, newDate: Date) => void;
}

const CalendarView = ({
  posts = [],
  onCreatePost = () => {},
  onEditPost = () => {},
  onReschedulePost = () => {},
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [draggedPost, setDraggedPost] = useState<string | null>(null);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggedPost(postId);
    e.dataTransfer.setData("text/plain", postId);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedPost) {
      onReschedulePost(draggedPost, date);
      setDraggedPost(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center py-2 font-medium text-sm text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayPosts = posts.filter((post) => {
            if (!post.scheduledTime || !(post.scheduledTime instanceof Date)) {
              return false;
            }
            try {
              return isSameDay(post.scheduledTime, day);
            } catch (error) {
              return false;
            }
          });

          return (
            <div
              key={index}
              className={`min-h-[100px] p-1 border rounded-md ${isSameMonth(day, currentDate) ? "bg-background" : "bg-muted/30"}`}
              onDrop={(e) => handleDrop(e, day)}
              onDragOver={handleDragOver}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-sm ${isSameDay(day, new Date()) ? "font-bold text-primary" : ""}`}
                >
                  {format(day, "d")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onCreatePost()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {dayPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`text-xs p-1 rounded-sm cursor-move flex items-center gap-1 ${getPlatformColor(post.platforms[0] || "instagram")}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, post.id)}
                    onClick={() => onEditPost(post)}
                  >
                    <div className="flex gap-1">
                      {post.platforms.map((platform, idx) => (
                        <div key={idx}>{getPlatformIcon(platform)}</div>
                      ))}
                    </div>
                    <span className="truncate flex-1">
                      {post.content.substring(0, 20)}...
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30";
      case "twitter":
        return "bg-blue-500/20 hover:bg-blue-500/30";
      case "linkedin":
        return "bg-blue-700/20 hover:bg-blue-700/30";
      default:
        return "bg-gray-200 hover:bg-gray-300";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-3 w-3 text-pink-600" />;
      case "twitter":
        return <Twitter className="h-3 w-3 text-blue-500" />;
      case "linkedin":
        return <Linkedin className="h-3 w-3 text-blue-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-background w-full h-full overflow-auto p-4">
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Calendar</h2>
              <Tabs defaultValue="month" className="ml-4">
                <TabsList>
                  <TabsTrigger value="month" onClick={() => setView("month")}>
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="week" onClick={() => setView("week")}>
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="day" onClick={() => setView("day")}>
                    Day
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-medium w-32 text-center">
                {format(currentDate, "MMMM yyyy")}
              </h3>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="calendar-container">{renderCalendarDays()}</div>

          <div className="mt-4 flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span className="text-xs">Instagram</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">Twitter</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-700"></div>
              <span className="text-xs">LinkedIn</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
