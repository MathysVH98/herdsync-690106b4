import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { useAskAProUsage } from "@/hooks/useAskAProUsage";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle, ArrowUpCircle, Camera, X, ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionRequiredDialog } from "@/components/SubscriptionRequiredDialog";
import { useToast } from "@/hooks/use-toast";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 data URL
};

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

const SUGGESTED_QUESTIONS = [
  "My cow has stopped eating and seems lethargic. What could be wrong?",
  "What's the best vaccination schedule for sheep in South Africa?",
  "How do I identify and treat redwater in cattle?",
  "What should I feed my goats during the dry season?",
];

export default function AskAPro() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { subscription, isActive } = useSubscription();
  const {
    questionsUsed,
    questionsRemaining,
    dailyLimit,
    canAsk,
    isUnlimited,
    loading: usageLoading,
    incrementUsage,
  } = useAskAProUsage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const tier = subscription?.tier || "basic";
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  useEffect(() => {
    if (subscription && !isActive) {
      setShowSubscriptionDialog(true);
    }
  }, [subscription, isActive]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageCapture = useCallback(async () => {
    if (!canAsk) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Native: use Capacitor Camera
        const photo = await CapCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt, // Let user choose camera or gallery
        });

        if (photo.base64String) {
          const format = photo.format || "jpeg";
          const dataUrl = `data:image/${format};base64,${photo.base64String}`;
          
          // Check size (base64 is ~33% larger than binary)
          const sizeEstimate = (photo.base64String.length * 3) / 4;
          if (sizeEstimate > MAX_IMAGE_SIZE) {
            toast({ variant: "destructive", title: "Image too large", description: "Please select an image under 20MB." });
            return;
          }
          setSelectedImage(dataUrl);
        }
      } else {
        // Web: use file input
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      // User cancelled - not an error
      if (err?.message?.includes("cancelled") || err?.message?.includes("canceled")) return;
      console.error("Camera error:", err);
      toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera. Please try selecting a file instead." });
    }
  }, [canAsk, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast({ variant: "destructive", title: "Image too large", description: "Please select an image under 20MB." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please select an image file." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = "";
  }, [toast]);

  const streamChat = async (chatMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Please log in to use Ask a Pro");
    }

    // Send messages with optional image field
    const payload = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.image ? { image: m.image } : {}),
    }));

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-a-pro`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: payload }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to get response" }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body received");
    }

    return response;
  };

  const handleSubmit = async (e?: React.FormEvent, suggestedQuestion?: string) => {
    e?.preventDefault();
    const messageText = suggestedQuestion || input.trim();
    if ((!messageText && !selectedImage) || isLoading) return;

    if (!canAsk) return;

    const success = await incrementUsage();
    if (!success && !isUnlimited) return;

    const userMessage: Message = {
      role: "user",
      content: messageText || "Please analyze this image.",
      ...(selectedImage ? { image: selectedImage } : {}),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await streamChat(updatedMessages);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: `I'm sorry, I couldn't process your request. ${errorMessage}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const showLimitReached = isActive && !isUnlimited && !canAsk && !usageLoading;

  return (
    <Layout>
      <SubscriptionRequiredDialog
        open={showSubscriptionDialog && !isActive}
        onOpenChange={setShowSubscriptionDialog}
        featureName="Ask a Pro"
        requiredTier="basic"
        description="Ask a Pro requires an active subscription. Get instant AI-powered advice on farming, livestock health, and animal care."
      />

      {/* Hidden file input for web image selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display">Ask a Pro</CardTitle>
                  <CardDescription>
                    AI-powered farming advice — text or 📷 photo identification
                  </CardDescription>
                </div>
              </div>

              {!isUnlimited && (
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={questionsRemaining > 0 ? "secondary" : "destructive"}>
                      {questionsRemaining} / {dailyLimit} questions left
                    </Badge>
                  </div>
                  <Progress
                    value={(questionsUsed / dailyLimit) * 100}
                    className="w-32 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Resets daily</p>
                </div>
              )}

              {isUnlimited && (
                <Badge variant="default" className="bg-gradient-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Unlimited
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {showLimitReached && (
              <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Daily limit reached</p>
                      <p className="text-sm text-muted-foreground">
                        You've used all {dailyLimit} questions for today. Upgrade for more!
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/pricing")}
                    size="sm"
                    className="bg-gradient-primary gap-2"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Ask me anything about farming, livestock health, or snap a photo for instant identification!
                  </p>
                  <div className="grid gap-2 w-full max-w-lg">
                    {SUGGESTED_QUESTIONS.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left h-auto py-3 px-4 justify-start"
                        onClick={() => handleSubmit(undefined, question)}
                        disabled={!canAsk || isLoading}
                      >
                        <span className="line-clamp-2">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {/* Image thumbnail in user messages */}
                        {message.image && (
                          <div className="mb-2">
                            <img
                              src={message.image}
                              alt="Uploaded"
                              className="rounded-md max-h-48 max-w-full object-cover"
                            />
                          </div>
                        )}
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          {messages[messages.length - 1]?.image ? "Analyzing image..." : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Image preview bar */}
            {selectedImage && (
              <div className="px-4 pt-3 border-t flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="h-16 w-16 rounded-md object-cover border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Photo attached — add a question or send as-is</span>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t flex gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  canAsk
                    ? "Ask about livestock health, or attach a photo for ID..."
                    : "Daily question limit reached. Upgrade for more questions!"
                }
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={!canAsk}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-auto flex-1"
                  disabled={!canAsk || isLoading}
                  onClick={handleImageCapture}
                  title="Take or select a photo"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !selectedImage) || !canAsk}
                  size="icon"
                  className="h-auto flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
