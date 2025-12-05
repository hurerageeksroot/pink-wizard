import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  MessageSquare,
  Trophy,
  Target,
  HelpCircle,
  Send,
  Image,
  Hash,
} from "lucide-react";
import { useCommunity, type CommunityPost } from "@/hooks/useCommunity";

const POST_TYPES = [
  {
    value: "general",
    label: "General",
    icon: MessageSquare,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  {
    value: "achievement",
    label: "Achievement",
    icon: Trophy,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  },
  {
    value: "milestone",
    label: "Milestone",
    icon: Target,
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
  {
    value: "question",
    label: "Question",
    icon: HelpCircle,
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
] as const;

export function PostComposer() {
  const [content, setContent] = useState("");
  const [postType, setPostType] =
    useState<CommunityPost["post_type"]>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { createPost } = useCommunity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createPost(content.trim(), postType);
      setContent("");
      setPostType("general");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-2 border-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          Share with the community
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = postType === type.value;
              return (
                <Badge
                  key={type.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? type.color : "hover:bg-muted"
                  }`}
                  onClick={() => setPostType(type.value)}
                >
                  {/* <Icon className="w-3 h-3 mr-1" /> */}
                  {type.label}
                </Badge>
              );
            })}
          </div>

          <Textarea
            placeholder={
              postType === "achievement"
                ? "Share your latest win! What did you accomplish? 🎉"
                : postType === "milestone"
                ? "What milestone are you celebrating? Tell us about your journey! 🎯"
                : postType === "question"
                ? "What would you like to know? The community is here to help! ❓"
                : "Share your thoughts, progress, or connect with the community..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none border-2 focus:border-primary/50 transition-colors"
            maxLength={1000}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {content.length}/1000 characters
              </span>
              {content.length > 800 && (
                <span className="text-xs text-orange-500 font-medium">
                  Almost at limit!
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-primary/25"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
