import { useState, useRef, useEffect } from "react";
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
import { Send, Bot, User, Loader2, Sparkles, Lock, AlertTriangle, ArrowUpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { subscription, isActive } = useSubscription();
  const { 
    questionsUsed, 
    questionsRemaining, 
    dailyLimit, 
    canAsk, 
    isUnlimited, 
    loading: usageLoading,
    incrementUsage 
  } = useAskAProUsage();
  const navigate = useNavigate();

  const tier = subscription?.tier || "basic";

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-a-pro`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: userMessages }),
      }
    );

    if (!response.ok || !response.body) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get response");
    }

    return response;
  };

  const handleSubmit = async (e?: React.FormEvent, suggestedQuestion?: string) => {
    e?.preventDefault();
    const messageText = suggestedQuestion || input.trim();
    if (!messageText || isLoading) return;

    // Check if user can ask
    if (!canAsk) {
      return;
    }

    // Increment usage first
    const success = await incrementUsage();
    if (!success && !isUnlimited) {
      return;
    }

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await streamChat(updatedMessages);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message
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
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Not active subscription
  if (!isActive) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display">Subscription Required</CardTitle>
              <CardDescription>
                Ask a Pro requires an active subscription. Get instant AI-powered
                advice on farming, livestock health, and animal care.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/pricing")} className="bg-gradient-primary">
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Usage limit reached (non-Pro users)
  const showLimitReached = !isUnlimited && !canAsk && !usageLoading;

  return (
    <Layout>
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
                    AI-powered farming and livestock advice for South African farmers
                  </CardDescription>
                </div>
              </div>
              
              {/* Usage indicator */}
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
            {/* Limit Reached Banner */}
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
                    Ask me anything about farming, livestock health, animal nutrition, or farm
                    management. I'm here to help!
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
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t flex gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  canAsk 
                    ? "Ask about livestock health, farming advice, or animal care..." 
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
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim() || !canAsk} 
                size="icon" 
                className="h-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
