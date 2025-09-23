import { PostComposer } from './PostComposer';
import { FeedPostCard } from './FeedPostCard';
import { useCommunity } from '@/hooks/useCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Users, MessageSquare, RefreshCw, TrendingUp, Trash2 } from 'lucide-react';
export function CommunityFeed() {
  const { user } = useAuth();
  const {
    posts,
    loading,
    refreshing,
    fetchPosts,
    deleteDemoPosts
  } = useCommunity();

  const handleDeleteDemoPosts = () => {
    if (confirm('Are you sure you want to delete all demo posts? This action cannot be undone.')) {
      deleteDemoPosts();
    }
  };
  if (loading) {
    return <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        {[1, 2, 3].map(i => <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground py-[20px]">Community Feed</h2>
            <p className="text-muted-foreground">
              Share your progress and connect with others on the same journey
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{posts.length} posts</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDeleteDemoPosts} className="flex items-center gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
            Delete Demo Posts
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchPosts(true)} disabled={refreshing} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Post Composer */}
      <PostComposer />

      {/* Posts Feed */}
      {posts.length === 0 ? <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your progress with the community!
            </p>
          </CardContent>
        </Card> : <div className="space-y-4">
          {posts.map(post => <FeedPostCard key={post.id} post={post} />)}
        </div>}
    </div>;
}