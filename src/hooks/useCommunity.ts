import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    avatar_url?: string | null;
  };
  reactions: Array<{
    id: string;
    reaction_type: string;
    user_id: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles: {
      display_name: string;
      avatar_url?: string | null;
    };
  }>;
  _count: {
    reactions: number;
    comments: number;
  };
}

export interface CommunityReaction {
  id: string;
  reaction_type: 'like' | 'celebrate' | 'support' | 'insightful';
  user_id: string;
}

export function useCommunity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch community posts with reactions and comments
  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // First get posts with basic profile info
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Then get reactions and comments separately
      const postIds = postsData?.map(post => post.id) || [];
      
      const [reactionsData, commentsData] = await Promise.all([
        postIds.length > 0 ? supabase
          .from('community_reactions')
          .select('*')
          .in('post_id', postIds) : Promise.resolve({ data: [] }),
        postIds.length > 0 ? supabase
          .from('community_comments')
          .select(`
            *,
            profiles (display_name, avatar_url)
          `)
          .in('post_id', postIds)
          .order('created_at', { ascending: true }) : Promise.resolve({ data: [] })
      ]);

      // Transform and combine the data
      const transformedPosts = postsData?.map(post => {
        const postReactions = reactionsData.data?.filter(r => r.post_id === post.id) || [];
        const postComments = commentsData.data?.filter(c => c.post_id === post.id) || [];
        
        return {
          ...post,
          profiles: post.profiles || { display_name: 'Unknown User', avatar_url: null },
          _count: {
            reactions: postReactions.length,
            comments: postComments.length,
          },
          reactions: postReactions,
          comments: postComments.map(comment => ({
            ...comment,
            profiles: comment.profiles || { display_name: 'Unknown User', avatar_url: null }
          })),
        };
      }) || [];

      setPosts(transformedPosts as CommunityPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (!isRefresh) {
        toast({
          title: 'Error',
          description: 'Failed to load community posts',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create a new post
  const createPost = async (content: string, postType: string = 'general', metadata = {}) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            user_id: user.id,
            content,
            post_type: postType,
            metadata,
          },
        ])
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Create the new post object with the expected structure
      const newPost: CommunityPost = {
        ...data,
        profiles: data.profiles || { display_name: 'Unknown User', avatar_url: null },
        reactions: [],
        comments: [],
        _count: {
          reactions: 0,
          comments: 0,
        },
      };

      // Add the new post to the top of the posts array
      setPosts(prevPosts => [newPost, ...prevPosts]);

      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    }
  };

  // Add a reaction to a post
  const addReaction = async (postId: string, reactionType: CommunityReaction['reaction_type']) => {
    if (!user) {
      console.log('addReaction: No user logged in');
      return;
    }

    console.log('Adding reaction:', { postId, reactionType, userId: user.id });

    // Optimistic update: immediately add reaction to local state
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const newReaction = {
            id: `temp-${Date.now()}`, // temporary ID
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
            created_at: new Date().toISOString()
          };
          
          return {
            ...post,
            reactions: [...post.reactions, newReaction],
            _count: {
              ...post._count,
              reactions: post.reactions.length + 1
            }
          };
        }
        return post;
      })
    );

    try {
      // Check if reaction already exists to prevent duplicate key errors
      const { data: existingReaction } = await supabase
        .from('community_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .single();

      if (!existingReaction) {
        // Only insert if reaction doesn't exist
        const { error } = await supabase
          .from('community_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) {
          console.error('Error adding reaction:', error);
          throw error;
        }
      }

      console.log('Reaction added successfully');
      // Refresh to get real IDs and ensure consistency
      await fetchPosts(true);
    } catch (error) {
      console.error('Error adding reaction:', error);
      
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              reactions: post.reactions.filter(r => 
                !(r.user_id === user.id && r.reaction_type === reactionType)
              ),
              _count: {
                ...post._count,
                reactions: Math.max(0, post.reactions.length - 1)
              }
            };
          }
          return post;
        })
      );
      
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  // Remove a reaction from a post
  const removeReaction = async (postId: string, reactionType: CommunityReaction['reaction_type']) => {
    if (!user) {
      console.log('removeReaction: No user logged in');
      return;
    }

    console.log('Removing reaction:', { postId, reactionType, userId: user.id });

    // Optimistic update: immediately remove reaction from local state
    let removedReaction: any = null;
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          removedReaction = post.reactions.find(r => 
            r.user_id === user.id && r.reaction_type === reactionType
          );
          
          return {
            ...post,
            reactions: post.reactions.filter(r => 
              !(r.user_id === user.id && r.reaction_type === reactionType)
            ),
            _count: {
              ...post._count,
              reactions: Math.max(0, post.reactions.length - 1)
            }
          };
        }
        return post;
      })
    );

    try {
      const { error } = await supabase
        .from('community_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }

      console.log('Reaction removed successfully');
      // Refresh to ensure consistency
      await fetchPosts(true);
    } catch (error) {
      console.error('Error removing reaction:', error);
      
      // Revert optimistic update on error
      if (removedReaction) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                reactions: [...post.reactions, removedReaction],
                _count: {
                  ...post._count,
                  reactions: post.reactions.length + 1
                }
              };
            }
            return post;
          })
        );
      }
      
      toast({
        title: 'Error',
        description: 'Failed to remove reaction',
        variant: 'destructive',
      });
    }
  };

  // Add a comment to a post
  const addComment = async (postId: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content,
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Comment added successfully!',
      });

      // Refresh posts to show new comment
      fetchPosts(true);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  // Delete a post with optimistic UI update for instant feedback
  const deletePost = async (postId: string) => {
    if (!user) return;

    // Store the post being deleted for potential rollback
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) return;

    // Optimistic update - remove from UI immediately
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

    try {
      console.log('Deleting post:', postId);
      
      // Single database call - let RLS policies handle permissions
      // No need for separate admin check since we have RLS policies in place
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Delete failed:', error);
        // Rollback: add the post back to UI
        setPosts(prevPosts => {
          // Insert back in original position to maintain order
          const newPosts = [...prevPosts];
          const originalIndex = posts.findIndex(p => p.id === postId);
          newPosts.splice(originalIndex, 0, postToDelete);
          return newPosts;
        });
        
        throw error;
      }

      console.log('Post deleted successfully');
      
      toast({
        title: 'Success',
        description: 'Post deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error.message.includes('Row Level Security') 
          ? 'You can only delete your own posts'
          : 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  // Optimized bulk delete demo posts with immediate UI feedback
  const deleteDemoPosts = async () => {
    if (!user) return;

    // Find demo posts to delete
    const demoPostsToDelete = posts.filter(post => 
      post.content.toLowerCase().includes('welcome to the community') || 
      post.content.toLowerCase().includes('just hit my first milestone')
    );

    if (demoPostsToDelete.length === 0) {
      toast({
        title: 'Info',
        description: 'No demo posts found to delete',
      });
      return;
    }

    // Optimistic update - remove demo posts from UI immediately
    setPosts(prevPosts => prevPosts.filter(post => 
      !post.content.toLowerCase().includes('welcome to the community') && 
      !post.content.toLowerCase().includes('just hit my first milestone')
    ));

    try {
      console.log('Deleting demo posts');
      
      // Single database call - RLS policies will handle admin permissions
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .or('content.ilike.%Welcome to the community%,content.ilike.%Just hit my first milestone%');

      if (error) {
        console.error('Demo posts delete error:', error);
        // Rollback: add demo posts back to UI
        setPosts(prevPosts => [...demoPostsToDelete, ...prevPosts].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        throw error;
      }

      console.log('Demo posts deleted successfully');
      
      toast({
        title: 'Success',
        description: `${demoPostsToDelete.length} demo posts deleted successfully!`,
      });
    } catch (error) {
      console.error('Error deleting demo posts:', error);
      toast({
        title: 'Error',
        description: error.message.includes('Row Level Security') 
          ? 'Admin access required to delete demo posts'
          : 'Failed to delete demo posts',
        variant: 'destructive',
      });
    }
  };

  // Check if user has reacted to a post with specific reaction type
  const hasUserReacted = (post: CommunityPost, reactionType: CommunityReaction['reaction_type']) => {
    if (!user) {
      console.log('hasUserReacted: No user logged in');
      return false;
    }
    
    const userReaction = post.reactions.find(
      reaction => reaction.user_id === user.id && reaction.reaction_type === reactionType
    );
    
    console.log('hasUserReacted check:', {
      postId: post.id,
      userId: user.id,
      reactionType,
      totalReactions: post.reactions.length,
      userReaction,
      hasReacted: !!userReaction
    });
    
    return !!userReaction;
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  return {
    posts,
    loading,
    refreshing,
    createPost,
    addReaction,
    removeReaction,
    addComment,
    deletePost,
    deleteDemoPosts,
    hasUserReacted,
    fetchPosts,
  };
}