import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarIcon,
  X,
  Instagram,
  Linkedin,
  Clock,
  AlertCircle,
  Plus,
  Upload,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { postToX, scheduleXPost } from "@/api";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  altText?: string;
}

interface Post {
  id: string;
  content: string;
  media?: MediaFile[];
  platforms: ("instagram" | "twitter" | "linkedin")[];
  scheduledTime: Date;
  status: "draft" | "scheduled" | "posted" | "failed";
}

interface PostCreationPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialPost?: Post;
  onSave?: (data: Post) => void;
}

interface PostData {
  id?: string;
  content: string;
  media: MediaFile[];
  platforms: {
    instagram: boolean;
    twitter: boolean;
    linkedin: boolean;
  };
  scheduledDate: Date | null;
  scheduledTime: string;
  timezone: string;
  status: "draft" | "scheduled" | "posted" | "failed";
}

// Platform-specific photo limits
const PLATFORM_LIMITS = {
  instagram: 10,
  twitter: 4,
  linkedin: 9,
};
const X_CHAR_LIMIT = 280;

// Function to detect user's timezone
const detectUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return "America/New_York"; // fallback
  }
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const localTime = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return (localTime - date.getTime()) / 60000;
};

const zonedTimeToUtc = (date: Date, timeZone: string): Date => {
  const utcGuess = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60000);
};

const buildScheduledUtcIso = (
  date: Date,
  time: string,
  timeZone: string
): string | null => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  const localDateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );
  const utcDate = zonedTimeToUtc(localDateTime, timeZone);
  return utcDate.toISOString();
};

const PostCreationPanel: React.FC<PostCreationPanelProps> = ({
  isOpen = true,
  onClose = () => {},
  initialPost,
  onSave = () => {},
}) => {
  const { toast } = useToast();
  const [postData, setPostData] = useState<PostData>(() => {
    const detectedTimezone = detectUserTimezone();
    if (initialPost) {
      return {
        id: initialPost.id,
        content: initialPost.content,
        media: initialPost.media || [],
        platforms: {
          instagram: false,
          twitter: true,
          linkedin: false,
        },
        scheduledDate: initialPost.scheduledTime,
        scheduledTime: format(initialPost.scheduledTime, "HH:mm"),
        timezone: detectedTimezone,
        status: initialPost.status,
      };
    }
    return {
      content: "",
      media: [],
      platforms: {
        instagram: false,
        twitter: true,
        linkedin: false,
      },
      scheduledDate: null,
      scheduledTime: "",
      timezone: detectedTimezone,
      status: "draft",
    };
  });

  const [activeTab, setActiveTab] = useState("content");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const comingSoon = useCallback(() => {
    toast({
      title: "Coming soon",
      description: "This feature is coming soon.",
    });
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate the maximum allowed photos based on selected platforms
  const getMaxPhotoLimit = useCallback(() => {
    const selectedPlatforms = [];
    if (postData.platforms.instagram) selectedPlatforms.push(PLATFORM_LIMITS.instagram);
    if (postData.platforms.twitter) selectedPlatforms.push(PLATFORM_LIMITS.twitter);
    if (postData.platforms.linkedin) selectedPlatforms.push(PLATFORM_LIMITS.linkedin);
    
    if (selectedPlatforms.length === 0) return PLATFORM_LIMITS.instagram; // Default
    return Math.min(...selectedPlatforms);
  }, [postData.platforms]);

  const handleFileUpload = useCallback((files: FileList) => {
    const maxLimit = getMaxPhotoLimit();
    const currentCount = postData.media.length;
    const availableSlots = maxLimit - currentCount;
    
    if (availableSlots <= 0) {
      setErrors(prev => ({
        ...prev,
        media: `Maximum ${maxLimit} photos allowed for selected platforms`
      }));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    const newMediaFiles: MediaFile[] = [];

    filesToProcess.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const mediaFile: MediaFile = {
            id: `${Date.now()}-${index}`,
            file,
            preview: e.target?.result as string,
            altText: "",
          };
          newMediaFiles.push(mediaFile);
          
          if (newMediaFiles.length === filesToProcess.length) {
            setPostData(prev => ({
              ...prev,
              media: [...prev.media, ...newMediaFiles]
            }));
            
            if (filesToProcess.length < files.length) {
              setErrors(prev => ({
                ...prev,
                media: `Only ${filesToProcess.length} photos added. Maximum ${maxLimit} allowed.`
              }));
            } else {
              setErrors(prev => {
                const { media, ...rest } = prev;
                return rest;
              });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [postData.media.length, getMaxPhotoLimit]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const removeMedia = (id: string) => {
    setPostData(prev => ({
      ...prev,
      media: prev.media.filter(item => item.id !== id)
    }));
  };

  const updateAltText = (id: string, altText: string) => {
    setPostData(prev => ({
      ...prev,
      media: prev.media.map(item => 
        item.id === id ? { ...item, altText } : item
      )
    }));
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    setPostData(prev => {
      const newMedia = [...prev.media];
      const [removed] = newMedia.splice(fromIndex, 1);
      newMedia.splice(toIndex, 0, removed);
      return { ...prev, media: newMedia };
    });
  };

  const handleMediaDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMediaDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderMedia(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleMediaDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostData({ ...postData, content: e.target.value });
    validateContent(e.target.value);
  };

  // const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       const result = reader.result as string;
  //       setMediaPreview(result);
  //       setPostData({ ...postData, media: result });
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handlePlatformToggle = (
    platform: "instagram" | "twitter" | "linkedin",
  ) => {
    if (platform !== "twitter") {
      return;
    }

    setPostData((prev) => ({
      ...prev,
      platforms: {
        instagram: false,
        twitter: true,
        linkedin: false,
      },
    }));
    setErrors((prev) => {
      const { platforms, ...rest } = prev;
      return rest;
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setPostData({ ...postData, scheduledDate: date });
      setErrors((prev) => {
        const { schedule, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateContent = (content: string) => {
    const newErrors: Record<string, string> = {};

    if (content.length > X_CHAR_LIMIT) {
      newErrors.content = "X (Twitter) has a 280 character limit";
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (postData.content.length > X_CHAR_LIMIT) {
      newErrors.content = "X (Twitter) has a 280 character limit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePostNow = async () => {
    const text = postData.content.trim();

    if (text.length === 0) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please enter some text before posting.",
      });
      return;
    }

    if (text.length > X_CHAR_LIMIT) {
      toast({
        variant: "destructive",
        title: "Too long for X",
        description: "X (Twitter) has a 280 character limit.",
      });
      return;
    }

    setIsPosting(true);
    try {
      await postToX(text);
      toast({
        title: "Posted to X",
        description: "Your post was sent successfully.",
        duration: 5000,
      });
      setPostData((prev) => ({ ...prev, content: "" }));
      onClose();
    } catch (err: any) {
      const status = err?.status;
      if (status === 401) {
        toast({
          variant: "destructive",
          title: "Connect your X account first",
          description: "Please connect X (Twitter) and try again.",
          duration: 5000,
        });
      } else if (status === 502) {
        toast({
          variant: "destructive",
          title: "X rejected the post. Try again.",
          description: "Please try posting again in a moment.",
          duration: 5000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Something went wrong.",
          description: "Please try again.",
          duration: 5000,
        });
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async () => {
    const text = postData.content.trim();

    if (!postData.scheduledDate || !postData.scheduledTime) {
      setErrors((prev) => ({
        ...prev,
        schedule: "Select both a date and time to schedule this post.",
      }));
      return;
    }

    if (text.length === 0) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please enter some text before scheduling.",
      });
      return;
    }

    if (text.length > X_CHAR_LIMIT) {
      toast({
        variant: "destructive",
        title: "Too long for X",
        description: "X (Twitter) has a 280 character limit.",
      });
      return;
    }

    const scheduledAtUtc = buildScheduledUtcIso(
      postData.scheduledDate,
      postData.scheduledTime,
      postData.timezone
    );
    if (!scheduledAtUtc) {
      setErrors((prev) => ({
        ...prev,
        schedule: "Select both a date and time to schedule this post.",
      }));
      return;
    }

    setIsScheduling(true);
    try {
      await scheduleXPost({
        platform: "X",
        text,
        scheduled_at_utc: scheduledAtUtc,
        user_time_zone: postData.timezone,
      });
      toast({
        title: "Scheduled for X",
        description: "Your post has been added to the queue.",
        duration: 5000,
      });
      onClose();
    } catch (err: any) {
      const status = err?.status;
      if (status === 401) {
        toast({
          variant: "destructive",
          title: "Connect your X account first",
          description: "Please connect X (Twitter) and try again.",
          duration: 5000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Scheduling failed",
          description: "Please try again.",
          duration: 5000,
        });
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSave = (asDraft: boolean = false) => {
    if (validateForm()) {
      const selectedPlatforms: ("instagram" | "twitter" | "linkedin")[] = [];
      if (postData.platforms.instagram) selectedPlatforms.push("instagram");
      if (postData.platforms.twitter) selectedPlatforms.push("twitter");
      if (postData.platforms.linkedin) selectedPlatforms.push("linkedin");

      const postToSave: Post = {
        id: postData.id || Date.now().toString(),
        content: postData.content,
        media: postData.media,
        platforms: selectedPlatforms,
        scheduledTime: postData.scheduledDate || new Date(),
        status: asDraft ? "draft" : "scheduled",
      };

      onSave(postToSave);
      onClose();
    }
  };

  const getCharacterLimit = () => {
    return X_CHAR_LIMIT;
  };

  const maxLimit = getMaxPhotoLimit();
  const currentCount = postData.media.length;

  return (
    <motion.div
      className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-background border-l shadow-xl z-50 flex flex-col"
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">
          {initialPost ? "Edit Post" : "Create New Post"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media" disabled title="Coming soon">
              Media (Coming soon)
            </TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platforms">Platforms</Label>
              <div className="flex flex-wrap gap-3">
                <div
                  className="flex items-center space-x-2 opacity-40 cursor-not-allowed"
                  title="Coming soon"
                >
                  <Switch
                    id="instagram"
                    checked={false}
                    disabled
                  />
                  <Label
                    htmlFor="instagram"
                    className="flex items-center gap-1"
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="twitter"
                    checked={postData.platforms.twitter}
                    onCheckedChange={() => handlePlatformToggle("twitter")}
                    disabled={isPosting}
                  />
                  <Label htmlFor="twitter" className="flex items-center gap-1">
                    <X className="h-4 w-4" /> X (Twitter)
                  </Label>
                </div>

                <div
                  className="flex items-center space-x-2 opacity-40 cursor-not-allowed"
                  title="Coming soon"
                >
                  <Switch
                    id="linkedin"
                    checked={false}
                    disabled
                  />
                  <Label htmlFor="linkedin" className="flex items-center gap-1">
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </Label>
                </div>
              </div>
              {errors.platforms && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.platforms}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="content">Post Content</Label>
                <span
                  className={`text-xs ${postData.content.length > getCharacterLimit() ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {postData.content.length}/{getCharacterLimit()}
                </span>
              </div>
              <Textarea
                id="content"
                placeholder="What do you want to share?"
                className="min-h-[150px]"
                value={postData.content}
                onChange={handleContentChange}
              />
              {errors.content && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.content}
                </p>
              )}
            </div>

            {postData.media.length > 0 && (
              <div className="space-y-2">
                <Label>Media Preview</Label>
                <div className="grid grid-cols-2 gap-2">
                  {postData.media.slice(0, 4).map((mediaItem, index) => (
                    <div key={mediaItem.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                      <img
                        src={mediaItem.preview}
                        alt={mediaItem.altText || `Photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      {postData.media.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            +{postData.media.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div
              className="relative"
              onClick={comingSoon}
              role="button"
              tabIndex={0}
              aria-disabled="true"
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && comingSoon()}
            >
              <div className="opacity-40 pointer-events-none space-y-3">
              <div className="flex items-center justify-between">
                <Label>Upload Photos</Label>
                <Badge variant="outline" className="text-xs">
                  {currentCount}/{maxLimit} photos
                </Badge>
              </div>

              {/* Photo limit warning */}
              {Object.values(postData.platforms).some(Boolean) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {postData.platforms.instagram && postData.platforms.twitter && 
                      "Instagram + Twitter: Max 4 photos (Twitter limit)"}
                    {postData.platforms.instagram && postData.platforms.linkedin && !postData.platforms.twitter &&
                      "Instagram + LinkedIn: Max 9 photos (LinkedIn limit)"}
                    {postData.platforms.twitter && postData.platforms.linkedin && !postData.platforms.instagram &&
                      "Twitter + LinkedIn: Max 4 photos (Twitter limit)"}
                    {postData.platforms.instagram && postData.platforms.twitter && postData.platforms.linkedin &&
                      "All platforms: Max 4 photos (Twitter limit)"}
                    {postData.platforms.instagram && !postData.platforms.twitter && !postData.platforms.linkedin &&
                      "Instagram only: Max 10 photos"}
                    {postData.platforms.twitter && !postData.platforms.instagram && !postData.platforms.linkedin &&
                      "Twitter only: Max 4 photos"}
                    {postData.platforms.linkedin && !postData.platforms.instagram && !postData.platforms.twitter &&
                      "LinkedIn only: Max 9 photos"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Drag and drop area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25"
                } ${currentCount >= maxLimit ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {currentCount >= maxLimit 
                    ? `Maximum ${maxLimit} photos reached`
                    : "Drag and drop multiple photos or click to upload"
                  }
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  disabled={currentCount >= maxLimit}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={currentCount >= maxLimit}
                >
                  Choose Photos
                </Button>
              </div>

              {errors.media && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {errors.media}
                  </AlertDescription>
                </Alert>
              )}

              {/* Photo grid */}
              {postData.media.length > 0 && (
                <div className="space-y-3">
                  <Label>Uploaded Photos ({currentCount})</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {postData.media.map((mediaItem, index) => (
                      <div
                        key={mediaItem.id}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-muted cursor-move"
                        draggable
                        onDragStart={(e) => handleMediaDragStart(e, index)}
                        onDragOver={(e) => handleMediaDragOver(e, index)}
                        onDragEnd={handleMediaDragEnd}
                      >
                        <img
                          src={mediaItem.preview}
                          alt={mediaItem.altText || `Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Drag handle */}
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
                        </div>
                        
                        {/* Remove button */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMedia(mediaItem.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        
                        {/* Photo number */}
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Alt text inputs */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Alt Text (for accessibility)
                    </Label>
                    {postData.media.map((mediaItem, index) => (
                      <Input
                        key={mediaItem.id}
                        placeholder={`Alt text for photo ${index + 1}`}
                        value={mediaItem.altText || ""}
                        onChange={(e) => updateAltText(mediaItem.id, e.target.value)}
                        className="text-xs"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Platform requirements */}
              <div className="space-y-2">
                <Label>Platform Requirements</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> Instagram
                    </Badge>
                    <span className="text-muted-foreground">
                      Up to 10 photos, requires media, optimal ratio 1:1 or 4:5
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <X className="h-3 w-3" /> X (Twitter)
                    </Badge>
                    <span className="text-muted-foreground">
                      Up to 4 photos, 280 character limit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Linkedin className="h-3 w-3" /> LinkedIn
                    </Badge>
                    <span className="text-muted-foreground">
                      Up to 9 photos, 3000 character limit
                    </span>
                  </div>
                </div>
              </div>
              </div>
              <div className="absolute inset-0 cursor-not-allowed" />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="space-y-3">
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-11"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postData.scheduledDate ? (
                      format(postData.scheduledDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={postData.scheduledDate || undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label>Schedule Time</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <Input
                    type="time"
                    className="h-11"
                    value={postData.scheduledTime}
                    onChange={(e) => {
                      setPostData({ ...postData, scheduledTime: e.target.value });
                      setErrors((prev) => {
                        const { schedule, ...rest } = prev;
                        return rest;
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Set</Label>
                  <Select
                    onValueChange={(value) => {
                      setPostData({ ...postData, scheduledTime: value });
                      setErrors((prev) => {
                        const { schedule, ...rest } = prev;
                        return rest;
                      });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Quick times" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="15:00">3:00 PM</SelectItem>
                      <SelectItem value="18:00">6:00 PM</SelectItem>
                      <SelectItem value="21:00">9:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.schedule && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.schedule}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Timezone: {postData.timezone} (auto-detected)
              </div>
              <div className="text-xs text-muted-foreground">
                Current time in{" "}
                {postData.timezone.split("/").slice(-1)[0]?.replace(/_/g, " ")}:{" "}
                {currentTime.toLocaleString("en-US", {
                  timeZone: postData.timezone,
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-sm text-muted-foreground">
                Scheduling Options
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handlePostNow}
                  disabled={isPosting || isScheduling}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Post Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleSchedule}
                  disabled={isPosting || isScheduling}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isScheduling ? "Scheduling..." : "Add to Queue"}
                </Button>
              </div>
            </div>
              
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t flex justify-between">
        <Button
          variant="outline"
          className="opacity-40 cursor-not-allowed"
          aria-disabled="true"
          onClick={comingSoon}
        >
          Save as Draft
        </Button>
        <div className="space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePostNow}
            disabled={isPosting || isScheduling}
            className="transition-all"
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Now"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCreationPanel;
