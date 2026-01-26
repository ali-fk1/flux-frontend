import React, { useState, useRef, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarIcon,
  ImageIcon,
  X,
  Instagram,
  Linkedin,
  Clock,
  Globe,
  AlertCircle,
  MapPin,
  Plus,
  Upload,
  GripVertical,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { postToX } from "@/api";

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
  timezone: string;
  status: "draft" | "scheduled" | "posted" | "failed";
}

// Platform-specific photo limits
const PLATFORM_LIMITS = {
  instagram: 10,
  twitter: 4,
  linkedin: 9,
};

const timezones = [
  // Americas
  { value: "America/New_York", label: "(GMT-05:00) Eastern Time (US & Canada)", region: "Americas" },
  { value: "America/Chicago", label: "(GMT-06:00) Central Time (US & Canada)", region: "Americas" },
  { value: "America/Denver", label: "(GMT-07:00) Mountain Time (US & Canada)", region: "Americas" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time (US & Canada)", region: "Americas" },
  { value: "America/Anchorage", label: "(GMT-09:00) Alaska Time", region: "Americas" },
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii Time", region: "Americas" },
  { value: "America/Toronto", label: "(GMT-05:00) Toronto", region: "Americas" },
  { value: "America/Vancouver", label: "(GMT-08:00) Vancouver", region: "Americas" },
  { value: "America/Mexico_City", label: "(GMT-06:00) Mexico City", region: "Americas" },
  { value: "America/Sao_Paulo", label: "(GMT-03:00) São Paulo", region: "Americas" },
  { value: "America/Buenos_Aires", label: "(GMT-03:00) Buenos Aires", region: "Americas" },
  { value: "America/Lima", label: "(GMT-05:00) Lima", region: "Americas" },
  { value: "America/Bogota", label: "(GMT-05:00) Bogotá", region: "Americas" },
  { value: "America/Santiago", label: "(GMT-03:00) Santiago", region: "Americas" },

  // Europe
  { value: "Europe/London", label: "(GMT+00:00) London", region: "Europe" },
  { value: "Europe/Paris", label: "(GMT+01:00) Central European Time", region: "Europe" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Berlin", region: "Europe" },
  { value: "Europe/Rome", label: "(GMT+01:00) Rome", region: "Europe" },
  { value: "Europe/Madrid", label: "(GMT+01:00) Madrid", region: "Europe" },
  { value: "Europe/Amsterdam", label: "(GMT+01:00) Amsterdam", region: "Europe" },
  { value: "Europe/Brussels", label: "(GMT+01:00) Brussels", region: "Europe" },
  { value: "Europe/Zurich", label: "(GMT+01:00) Zurich", region: "Europe" },
  { value: "Europe/Vienna", label: "(GMT+01:00) Vienna", region: "Europe" },
  { value: "Europe/Prague", label: "(GMT+01:00) Prague", region: "Europe" },
  { value: "Europe/Warsaw", label: "(GMT+01:00) Warsaw", region: "Europe" },
  { value: "Europe/Stockholm", label: "(GMT+01:00) Stockholm", region: "Europe" },
  { value: "Europe/Oslo", label: "(GMT+01:00) Oslo", region: "Europe" },
  { value: "Europe/Copenhagen", label: "(GMT+01:00) Copenhagen", region: "Europe" },
  { value: "Europe/Helsinki", label: "(GMT+02:00) Helsinki", region: "Europe" },
  { value: "Europe/Athens", label: "(GMT+02:00) Athens", region: "Europe" },
  { value: "Europe/Istanbul", label: "(GMT+03:00) Istanbul", region: "Europe" },
  { value: "Europe/Moscow", label: "(GMT+03:00) Moscow", region: "Europe" },

  // Asia
  { value: "Asia/Tokyo", label: "(GMT+09:00) Japan Standard Time", region: "Asia" },
  { value: "Asia/Shanghai", label: "(GMT+08:00) China Standard Time", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "(GMT+08:00) Hong Kong", region: "Asia" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore", region: "Asia" },
  { value: "Asia/Seoul", label: "(GMT+09:00) Seoul", region: "Asia" },
  { value: "Asia/Taipei", label: "(GMT+08:00) Taipei", region: "Asia" },
  { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok", region: "Asia" },
  { value: "Asia/Jakarta", label: "(GMT+07:00) Jakarta", region: "Asia" },
  { value: "Asia/Manila", label: "(GMT+08:00) Manila", region: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "(GMT+08:00) Kuala Lumpur", region: "Asia" },
  { value: "Asia/Mumbai", label: "(GMT+05:30) Mumbai", region: "Asia" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Kolkata", region: "Asia" },
  { value: "Asia/Delhi", label: "(GMT+05:30) Delhi", region: "Asia" },
  { value: "Asia/Dhaka", label: "(GMT+06:00) Dhaka", region: "Asia" },
  { value: "Asia/Karachi", label: "(GMT+05:00) Karachi", region: "Asia" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai", region: "Asia" },
  { value: "Asia/Riyadh", label: "(GMT+03:00) Riyadh", region: "Asia" },
  { value: "Asia/Tehran", label: "(GMT+03:30) Tehran", region: "Asia" },

  // Africa
  { value: "Africa/Cairo", label: "(GMT+02:00) Cairo", region: "Africa" },
  { value: "Africa/Lagos", label: "(GMT+01:00) Lagos", region: "Africa" },
  { value: "Africa/Johannesburg", label: "(GMT+02:00) Johannesburg", region: "Africa" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi", region: "Africa" },
  { value: "Africa/Casablanca", label: "(GMT+01:00) Casablanca", region: "Africa" },

  // Oceania
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney", region: "Oceania" },
  { value: "Australia/Melbourne", label: "(GMT+10:00) Melbourne", region: "Oceania" },
  { value: "Australia/Brisbane", label: "(GMT+10:00) Brisbane", region: "Oceania" },
  { value: "Australia/Perth", label: "(GMT+08:00) Perth", region: "Oceania" },
  { value: "Pacific/Auckland", label: "(GMT+12:00) Auckland", region: "Oceania" },
  { value: "Pacific/Fiji", label: "(GMT+12:00) Fiji", region: "Oceania" },
];

// Function to detect user's timezone
const detectUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return "America/New_York"; // fallback
  }
};

// Function to get current UTC offset for a timezone
const getTimezoneOffset = (timezone: string): string => {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    const sign = offset >= 0 ? "+" : "-";
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.round((Math.abs(offset) - hours) * 60);
    return `GMT${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } catch (error) {
    return "GMT+00:00";
  }
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
          instagram: initialPost.platforms.includes("instagram"),
          twitter: initialPost.platforms.includes("twitter"),
          linkedin: initialPost.platforms.includes("linkedin"),
        },
        scheduledDate: initialPost.scheduledTime,
        timezone: detectedTimezone,
        status: initialPost.status,
      };
    }
    return {
      content: "",
      media: [],
      platforms: {
        instagram: false,
        twitter: false,
        linkedin: false,
      },
      scheduledDate: null,
      timezone: detectedTimezone,
      status: "draft",
    };
  });

  const [activeTab, setActiveTab] = useState("content");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const comingSoon = useCallback(() => {
    toast({
      title: "Coming soon",
      description: "This feature is coming soon.",
    });
  }, [toast]);

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
    // Only X (Twitter) is allowed for now
    if (platform === "instagram" || platform === "linkedin") {
      comingSoon();
      return;
    }

    const newPlatforms = {
      ...postData.platforms,
      [platform]: !postData.platforms[platform],
    };
    
    setPostData({
      ...postData,
      platforms: newPlatforms,
    });

    // Check if media count exceeds new limit
    const newMaxLimit = getMaxPhotoLimitForPlatforms(newPlatforms);
    if (postData.media.length > newMaxLimit) {
      setErrors(prev => ({
        ...prev,
        media: `Reduced to ${newMaxLimit} photos due to platform restrictions. Please remove ${postData.media.length - newMaxLimit} photo(s).`
      }));
    } else {
      setErrors(prev => {
        const { media, ...rest } = prev;
        return rest;
      });
    }
  };

  const getMaxPhotoLimitForPlatforms = (platforms: typeof postData.platforms) => {
    const selectedPlatforms = [];
    if (platforms.instagram) selectedPlatforms.push(PLATFORM_LIMITS.instagram);
    if (platforms.twitter) selectedPlatforms.push(PLATFORM_LIMITS.twitter);
    if (platforms.linkedin) selectedPlatforms.push(PLATFORM_LIMITS.linkedin);
    
    if (selectedPlatforms.length === 0) return PLATFORM_LIMITS.instagram;
    return Math.min(...selectedPlatforms);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setPostData({ ...postData, scheduledDate: date });
    }
  };

  const handleTimezoneChange = (timezone: string) => {
    setPostData({ ...postData, timezone });
  };

  const validateContent = (content: string) => {
    const newErrors: Record<string, string> = {};

    if (postData.platforms.twitter && content.length > 280) {
      newErrors.content = "X (Twitter) has a 280 character limit";
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (postData.platforms.twitter && postData.content.length > 280) {
      newErrors.content = "X (Twitter) has a 280 character limit";
    }

    if (
      !postData.platforms.twitter &&
      true
    ) {
      newErrors.platforms = "Select X to post";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePostNow = async () => {
    const text = postData.content.trim();

    if (!postData.platforms.twitter) {
      toast({
        variant: "destructive",
        title: "Select X first",
        description: "Posting is only available for X right now.",
      });
      return;
    }

    if (text.length === 0) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please enter some text before posting.",
      });
      return;
    }

    if (text.length > 280) {
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
    if (postData.platforms.twitter) return 280;
    if (postData.platforms.linkedin) return 3000;
    return 2200; // Instagram
  };

  // Group timezones by region for better organization
  const groupedTimezones = timezones.reduce((acc, tz) => {
    if (!acc[tz.region]) {
      acc[tz.region] = [];
    }
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, typeof timezones>);

  // Get user's detected timezone info
  const detectedTimezone = detectUserTimezone();
  const detectedTimezoneInfo = timezones.find(tz => tz.value === detectedTimezone);

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
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platforms">Platforms</Label>
              <div className="flex flex-wrap gap-3">
                <div
                  className="flex items-center space-x-2 opacity-40 cursor-not-allowed"
                  role="button"
                  tabIndex={0}
                  aria-disabled="true"
                  onClick={comingSoon}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && comingSoon()}
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
                  role="button"
                  tabIndex={0}
                  aria-disabled="true"
                  onClick={comingSoon}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && comingSoon()}
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
            <div
              className="relative"
              onClick={comingSoon}
              role="button"
              tabIndex={0}
              aria-disabled="true"
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && comingSoon()}
            >
              <div className="opacity-40 pointer-events-none space-y-6">
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
                    value={
                      postData.scheduledDate
                        ? format(postData.scheduledDate, "HH:mm")
                        : ""
                    }
                    onChange={(e) => {
                      if (postData.scheduledDate) {
                        const [hours, minutes] = e.target.value
                          .split(":")
                          .map(Number);
                        const newDate = new Date(postData.scheduledDate);
                        newDate.setHours(hours, minutes);
                        setPostData({ ...postData, scheduledDate: newDate });
                      } else {
                        const now = new Date();
                        const [hours, minutes] = e.target.value
                          .split(":")
                          .map(Number);
                        now.setHours(hours, minutes);
                        setPostData({ ...postData, scheduledDate: now });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Set</Label>
                  <Select
                    onValueChange={(value) => {
                      const now = new Date();
                      const [hours, minutes] = value.split(":").map(Number);
                      const newDate = postData.scheduledDate ? new Date(postData.scheduledDate) : new Date();
                      newDate.setHours(hours, minutes);
                      setPostData({ ...postData, scheduledDate: newDate });
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
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="timezone">Timezone</Label>
                {detectedTimezoneInfo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => handleTimezoneChange(detectedTimezone)}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Use detected
                  </Button>
                )}
              </div>
              
              {detectedTimezoneInfo && postData.timezone !== detectedTimezone && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Detected: {detectedTimezoneInfo.label}
                  </div>
                </div>
              )}

              <Select
                value={postData.timezone}
                onValueChange={handleTimezoneChange}
              >
                <SelectTrigger className="h-11">
                  <Globe className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(groupedTimezones).map(([region, tzList]) => (
                    <div key={region}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                        {region}
                      </div>
                      {tzList.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          <div className="flex flex-col">
                            <span>{tz.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {tz.value.replace(/_/g, " ")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-muted-foreground">
                Current time in {postData.timezone.split('/')[1]?.replace(/_/g, ' ')}: {
                  new Date().toLocaleString("en-US", {
                    timeZone: postData.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                }
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-sm text-muted-foreground">
                Scheduling Options
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button variant="outline" className="w-full h-11">
                  <Clock className="mr-2 h-4 w-4" />
                  Post Now
                </Button>
                <Button variant="outline" className="w-full h-11">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Queue
                </Button>
              </div>
            </div>
              </div>
              <div className="absolute inset-0 cursor-not-allowed" />
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
            disabled={isPosting}
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
