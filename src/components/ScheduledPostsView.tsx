import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  parseISO,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { motion } from "framer-motion";
import {
  Grid,
  List,
  Calendar as CalendarIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getScheduledPosts,
  type ScheduledPost,
  type ScheduledPostsResponse,
} from "@/services/api";
import { cn } from "@/lib/utils";

type ViewMode = "card" | "list" | "calendar";

function formatScheduledAt(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy · h:mm a");
}

function toLocalDateKey(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

// Group posts by local date
function groupByDate(posts: ScheduledPost[]): Record<string, ScheduledPost[]> {
  return posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const key = toLocalDateKey(post.scheduledAtUtc);
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});
}

function CardViewPost({ post }: { post: ScheduledPost }) {
  const hasMedia = !!post.mediaUrl;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border border-border/50 bg-card">
        <CardContent className="p-0">
          {hasMedia ? (
            <div className="space-y-3">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={post.mediaUrl!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-4 pb-4">
                <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatScheduledAt(post.scheduledAtUtc)}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {post.status}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 px-6 py-6">
              <p className="text-center text-base font-medium leading-relaxed text-foreground line-clamp-4">
                {post.content}
              </p>
              <div className="mt-4 flex w-full items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatScheduledAt(post.scheduledAtUtc)}
                </span>
                <Badge variant="secondary" className="capitalize shrink-0">
                  {post.status}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ListViewPost({ post }: { post: ScheduledPost }) {
  const hasMedia = !!post.mediaUrl;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-3"
    >
      <div className="shrink-0 text-sm text-muted-foreground tabular-nums">
        {formatScheduledAt(post.scheduledAtUtc)}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {hasMedia && (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={post.mediaUrl!}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <p className="truncate text-sm text-foreground">{post.content}</p>
      </div>
      <Badge variant="secondary" className="shrink-0 capitalize">
        {post.status}
      </Badge>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 py-16 px-6">
      <CalendarDays className="h-12 w-12 text-muted-foreground/60 mb-3" />
      <p className="text-center text-muted-foreground">No scheduled posts yet</p>
    </div>
  );
}

export default function ScheduledPostsView() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("card");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFirstPage = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      // First request must be WITHOUT cursor
      const res: ScheduledPostsResponse = await getScheduledPosts({ size: 20 });
      setPosts(res.content);
      // Store nextCursor exactly as returned (never transform)
      setCursor(res.nextCursor);
      setHasNext(res.hasNext);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) {
        return;
      }
      setError(err?.message || "Failed to load posts");
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
    setError(null);
    try {
      // Pass cursor back exactly as received
      const res: ScheduledPostsResponse = await getScheduledPosts({
        size: 20,
        cursor,
      });
      setPosts((prev) => [...prev, ...res.content]);
      setCursor(res.nextCursor);
      setHasNext(res.hasNext);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err?.status === 401) {
        return;
      }
      setError(err?.message || "Failed to load posts");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [cursor, hasNext, navigate]);

  const resetAndRefetch = useCallback(() => {
    // Required mount reset behavior
    setPosts([]);
    setCursor(null);
    setHasNext(true);
    setError(null);
    setSelectedDay(null);
    fetchFirstPage();
  }, [fetchFirstPage]);

  useEffect(() => {
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

  const byDate = groupByDate(posts);

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayPosts = byDate[key] ?? [];
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "min-h-[100px] cursor-pointer rounded-lg border p-1.5 transition-colors",
                isSameMonth(day, calendarMonth) ? "bg-background" : "bg-muted/30",
                isSelected && "ring-2 ring-primary",
                isToday && !isSelected && "border-primary/50"
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  isToday && "font-bold text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayPosts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="truncate rounded px-1 py-0.5 text-xs bg-primary/10 text-primary"
                  >
                    {p.content.slice(0, 30)}
                    {p.content.length > 30 ? "…" : ""}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayPosts.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDayPosts = selectedDayKey ? byDate[selectedDayKey] ?? [] : [];

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto bg-background p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Scheduled Posts</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAndRefetch}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)} className="w-fit">
            <TabsList>
              <TabsTrigger value="card" className="gap-2">
                <Grid className="h-4 w-4" />
                Card
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading scheduled posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {view === "card" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <CardViewPost key={post.id} post={post} />
              ))}
            </div>
          )}

          {view === "list" && (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <ListViewPost key={post.id} post={post} />
              ))}
            </div>
          )}

          {view === "calendar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCalendarMonth((d) => subMonths(d, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="min-w-[140px] text-center font-medium">
                    {format(calendarMonth, "MMMM yyyy")}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCalendarMonth((d) => addMonths(d, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCalendarMonth(new Date());
                      setSelectedDay(new Date());
                    }}
                  >
                    Today
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">{renderCalendarDays()}</div>
              {selectedDay && (
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="mb-3 font-medium">
                      {format(selectedDay, "EEEE, MMMM d, yyyy")}
                    </h3>
                    {selectedDayPosts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No scheduled posts for this date
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayPosts.map((post) => (
                          <CardViewPost key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Infinite scroll sentinel (IntersectionObserver watches this) */}
          <div ref={sentinelRef} className="h-10" />

          {(loading || (hasNext && cursor != null)) && (
            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Loading more…" : hasNext ? "Scroll to load more" : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
