import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileUp, MessageCircle, Search, Send, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/useUser";
import {
  creatorMessagingService,
  formatTransferBytes,
  type CreatorDirectoryEntry,
  type CreatorMessage,
  type CreatorThread,
  type TransferSummary,
} from "@/services/messaging/creatorMessagingService";

export const Route = createFileRoute("/_authenticated/creator-messages")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <CreatorMessagesPage />
    </RoleGuard>
  ),
});

function CreatorMessagesPage() {
  const { user } = useUser();
  const [threads, setThreads] = useState<CreatorThread[]>([]);
  const [messages, setMessages] = useState<CreatorMessage[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [directory, setDirectory] = useState<CreatorDirectoryEntry[]>([]);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState<TransferSummary | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((thread) => thread.thread_id === active);
  const usage = summary
    ? Math.min(100, Math.round((summary.used_bytes / summary.monthly_bytes) * 100))
    : 0;

  const refreshThreads = async () => {
    const next = await creatorMessagingService.threads();
    setThreads(next);
    if (!active && next[0]) setActive(next[0].thread_id);
  };

  const refreshMessages = async (id = active) => {
    if (id) setMessages(await creatorMessagingService.messages(id));
    else setMessages([]);
  };

  const refreshSummary = async () => setSummary(await creatorMessagingService.summary());

  useEffect(() => {
    void Promise.all([refreshThreads(), refreshSummary()]).catch((error) =>
      toast.error(error.message),
    );
  }, []);

  useEffect(() => {
    void (async () => {
      if (active) await creatorMessagingService.markRead(active);
      await refreshMessages(active);
      if (active) await refreshThreads();
    })().catch((error) => toast.error(error instanceof Error ? error.message : "Could not refresh conversation"));
    setText("");
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [active]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void (async () => {
        if (active) {
          await creatorMessagingService.markRead(active);
          await refreshMessages(active);
        }
        await refreshThreads();
      })().catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        void creatorMessagingService
          .directory(query)
          .then(setDirectory)
          .catch(() => setDirectory([])),
      250,
    );
    return () => clearTimeout(timer);
  }, [query]);

  const start = async (creator: CreatorDirectoryEntry) => {
    try {
      const id = await creatorMessagingService.start(creator.user_id);
      await refreshThreads();
      setActive(id);
      setQuery("");
      setDirectory([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start conversation");
    }
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    try {
      await creatorMessagingService.send(active, text.trim());
      setText("");
      await Promise.all([refreshMessages(active), refreshThreads()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    }
  };

  const upload = async () => {
    if (!pendingFile || !active) return;
    const file = pendingFile;
    try {
      setProgress(0);
      await creatorMessagingService.upload(active, file, setProgress);
      toast.success(`File shared securely with ${activeThread?.other_name || "creator"}`);
      setPendingFile(null);
      await Promise.all([refreshMessages(active), refreshThreads(), refreshSummary()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File transfer failed");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Creator HQ</p>
          <h1 className="mt-2 text-4xl font-semibold">Creator Messages</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Private creator-to-creator conversations with secure large-file sharing. Shared files
            stay private and never enter your public Music Library automatically.
          </p>
        </div>

        {summary && (
          <div className="min-w-64 rounded-2xl border bg-card p-4">
            <div className="flex justify-between text-sm">
              <span>{formatTransferBytes(summary.used_bytes)} used</span>
              <span>{formatTransferBytes(summary.monthly_bytes)}/month</span>
            </div>
            <Progress value={usage} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {formatTransferBytes(summary.max_file_bytes)} max file · {summary.retention_days}-day
              retention
            </p>
          </div>
        )}
      </header>

      <div className="grid min-h-[650px] gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b p-4">
              <div className="mb-3">
                <h2 className="font-semibold">Conversations</h2>
                <p className="text-xs text-muted-foreground">
                  Choose a creator to open their private chat.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a creator"
                />
              </div>
            </div>

            {query && (
              <div className="border-b p-3">
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Find creators
                </p>
                <div className="space-y-1">
                  {directory.slice(0, 8).map((creator) => (
                    <button
                      key={creator.user_id}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
                      onClick={() => void start(creator)}
                    >
                      <CreatorAvatar
                        name={creator.artist_name}
                        avatar={creator.avatar_url}
                        sizeClass="h-10 w-10"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{creator.artist_name}</span>
                        {creator.username && (
                          <span className="block truncate text-xs text-muted-foreground">
                            @{creator.username}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}

                  {!directory.length && (
                    <p className="p-2 text-sm text-muted-foreground">No creators found.</p>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-[540px] space-y-1 overflow-y-auto p-3">
              {threads.map((thread) => {
                const selected = active === thread.thread_id;
                return (
                  <button
                    key={thread.thread_id}
                    onClick={() => setActive(thread.thread_id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      selected
                        ? "bg-primary/10 ring-1 ring-primary/40"
                        : "hover:bg-muted"
                    }`}
                  >
                    <CreatorAvatar
                      name={thread.other_name}
                      avatar={thread.other_avatar}
                      sizeClass="h-11 w-11"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{thread.other_name}</span>
                        {thread.last_message_at && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatConversationTime(thread.last_message_at)}
                          </span>
                        )}
                      </span>
                      {thread.other_username && (
                        <span className="block truncate text-xs text-muted-foreground">
                          @{thread.other_username}
                        </span>
                      )}
                      <span className="mt-1 flex items-center gap-2">
                        <span className={`min-w-0 flex-1 truncate text-xs ${thread.unread_count ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {thread.last_preview || "Start the conversation"}
                        </span>
                        {thread.unread_count ? (
                          <span className="shrink-0 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground" aria-label={`${thread.unread_count} unread messages`}>
                            {thread.unread_count > 99 ? "99+" : thread.unread_count}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })}

              {!threads.length && !query && (
                <div className="p-5 text-center text-sm text-muted-foreground">
                  Search for another creator to begin a private conversation.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex h-full min-h-[650px] flex-col p-0">
            {activeThread ? (
              <>
                <div className="flex items-center justify-between gap-4 border-b p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <CreatorAvatar
                      name={activeThread.other_name}
                      avatar={activeThread.other_avatar}
                      sizeClass="h-12 w-12"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{activeThread.other_name}</h2>
                      {activeThread.other_username && (
                        <p className="truncate text-sm text-muted-foreground">
                          @{activeThread.other_username}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Private conversation with {activeThread.other_name}
                      </p>
                    </div>
                  </div>

                  <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                    <ShieldCheck className="h-4 w-4" />
                    Private & secure
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {!messages.length && (
                    <div className="flex h-full min-h-56 items-center justify-center text-center">
                      <div className="max-w-sm text-muted-foreground">
                        <MessageCircle className="mx-auto mb-3 h-10 w-10" />
                        <p className="font-medium text-foreground">
                          Start your conversation with {activeThread.other_name}
                        </p>
                        <p className="mt-1 text-sm">
                          Messages and private file transfers with this creator stay in this thread.
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <MessageBubble
                      key={message.message_id}
                      item={message}
                      mine={message.sender_user_id === user?.id}
                    />
                  ))}
                </div>

                <div className="border-t bg-card p-4">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => setPendingFile(event.target.files?.[0] || null)}
                  />

                  {pendingFile && (
                    <div className="mb-3 rounded-xl border bg-muted/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            Send this file to {activeThread.other_name}?
                          </p>
                          <p className="mt-1 break-all text-sm text-muted-foreground">
                            {pendingFile.name} · {formatTransferBytes(pendingFile.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPendingFile(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          aria-label="Cancel file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() => void upload()}
                          disabled={progress !== null}
                        >
                          <FileUp className="mr-2 h-4 w-4" />
                          Send file
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPendingFile(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          disabled={progress !== null}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {progress !== null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs">
                        <span>Uploading securely...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="mt-1" />
                    </div>
                  )}

                  <div className="rounded-2xl border bg-background p-2">
                    <textarea
                      className="min-h-[88px] w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void send();
                        }
                      }}
                      placeholder={`Type a message to ${activeThread.other_name}...`}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-1 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileRef.current?.click()}
                        disabled={progress !== null}
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Large file
                      </Button>

                      <Button onClick={() => void send()} disabled={!text.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    You are messaging {activeThread.other_name}. Large files use your monthly
                    Creator transfer allowance; downloads do not reduce the sender-visible
                    allowance.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div className="max-w-sm text-muted-foreground">
                  <MessageCircle className="mx-auto mb-3 h-12 w-12" />
                  <h2 className="text-lg font-semibold text-foreground">Select a creator</h2>
                  <p className="mt-2 text-sm">
                    Choose an existing conversation or use Find a creator to start a new private
                    chat. Messaging and file controls appear only after a creator is selected.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceivingPreference />
    </div>
  );
}

function CreatorAvatar({
  name,
  avatar,
  sizeClass,
}: {
  name: string;
  avatar: string | null;
  sizeClass: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold ${sizeClass}`}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : initials ? (
        initials
      ) : (
        <UserRound className="h-4 w-4" />
      )}
    </span>
  );
}

function MessageBubble({ item, mine }: { item: CreatorMessage; mine: boolean }) {
  const expired = item.expires_at ? new Date(item.expires_at) <= new Date() : false;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 ${
          mine ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {item.file_id ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <FileUp className="h-4 w-4" />
              {item.file_name || "Shared file"}
            </div>
            <p
              className={`text-xs ${
                mine ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {item.size_bytes ? formatTransferBytes(item.size_bytes) : ""}
              {item.expires_at
                ? ` · ${
                    expired
                      ? "Expired"
                      : `Available until ${new Date(item.expires_at).toLocaleDateString()}`
                  }`
                : ""}
            </p>
            {!expired && item.transfer_status === "ready" && (
              <Button
                size="sm"
                variant={mine ? "secondary" : "outline"}
                onClick={() =>
                  item.file_id &&
                  creatorMessagingService.download(item.file_id).catch((error) =>
                    toast.error(error.message),
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {expired && <span className="text-xs">File expired; conversation record retained.</span>}
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{item.body}</p>
        )}

        <p
          className={`mt-1 text-[10px] ${
            mine ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function ReceivingPreference() {
  const [allow, setAllow] = useState(true);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-medium">Receive large files from creators</h2>
          <p className="text-sm text-muted-foreground">
            Turn this off to block new large-file transfers while keeping normal creator messages
            available.
          </p>
        </div>
        <Switch
          checked={allow}
          onCheckedChange={(value) => {
            setAllow(value);
            void creatorMessagingService
              .setLargeFilePreference(value)
              .then(() =>
                toast.success(
                  value ? "Large-file receiving enabled" : "Large-file receiving disabled",
                ),
              )
              .catch((error) => {
                setAllow(!value);
                toast.error(error.message);
              });
          }}
        />
      </CardContent>
    </Card>
  );
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
