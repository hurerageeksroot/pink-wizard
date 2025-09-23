import { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ReactionBar } from './ReactionBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useCommunity, type CommunityPost } from '@/hooks/useCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Send, Clock, Trophy, Target, HelpCircle, MessageSquare, MoreHorizontal, Flag, Share2, BookmarkPlus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const POST_TYPE_CONFIG = {
  general: { icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600 border-blue-200', label: 'General' },
  achievement: { icon: Trophy, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', label: 'Achievement' },
  milestone: { icon: Target, color: 'bg-green-500/10 text-green-600 border-green-200', label: 'Milestone' },
  question: { icon: HelpCircle, color: 'bg-purple-500/10 text-purple-600 border-purple-200', label: 'Question' },
} as const;

interface FeedPostCardProps {
  post: CommunityPost;
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const { user } = useAuth();
  const { addComment, deletePost } = useCommunity();

  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.general;
  const Icon = typeConfig.icon;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setIsAddingComment(true);
    try {
      await addComment(post.id, commentText.trim());
      setCommentText('');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleSharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.profiles?.display_name || 'Anonymous User'}`,
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast here
    }
  };

  const handleSavePost = () => {
    // TODO: Implement save functionality
    console.log('Save post:', post.id);
  };

  const handleReportPost = () => {
    // TODO: Implement report functionality
    console.log('Report post:', post.id);
  };

  const handleDeletePost = async () => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      await deletePost(post.id);
    }
  };

  const isOwnPost = user?.id === post.user_id;

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20">
      <CardHeader className="pb-4">
        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/10">
              <AvatarImage src={post.profiles?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {getUserInitials(post.profiles?.display_name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-lg">
                  {post.profiles?.display_name || 'Anonymous User'}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs border ${typeConfig.color}`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {typeConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSharePost} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" />
                Share Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSavePost} className="cursor-pointer">
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Save Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeletePost} className="cursor-pointer text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReportPost} className="cursor-pointer text-destructive">
                <Flag className="w-4 h-4 mr-2" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Post Content */}
        <div className="mb-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
            {post.content}
          </p>
        </div>

        {/* Reactions */}
        <div className="mb-6">
          <ReactionBar post={post} />
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4">
            <Separator className="my-4" />
            
            {/* Existing Comments */}
            {post.comments.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments ({post.comments.length})
                </h4>
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="w-8 h-8 ring-1 ring-border">
                      <AvatarImage src={comment.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {getUserInitials(comment.profiles?.display_name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/30 rounded-xl p-4 group-hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-foreground">
                          {comment.profiles?.display_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <div className="flex gap-3 mt-4">
              <Avatar className="w-8 h-8 ring-1 ring-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  You
                </AvatarFallback>
              </Avatar>
              <form onSubmit={handleAddComment} className="flex-1 flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 border-2 focus:border-primary/50 transition-colors rounded-full"
                  disabled={isAddingComment}
                  maxLength={500}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!commentText.trim() || isAddingComment}
                  className="rounded-full bg-primary hover:bg-primary/90 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Comments Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 rounded-full"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {post.comments.length > 0 
            ? `${showComments ? 'Hide' : 'View'} ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}`
            : 'Add comment'
          }
        </Button>
      </CardContent>
    </Card>
  );
}
