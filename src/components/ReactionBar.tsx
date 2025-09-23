import { Button } from './ui/button';
import { Heart, PartyPopper, HandHeart, Lightbulb } from 'lucide-react';
import { useCommunity, type CommunityPost, type CommunityReaction } from '@/hooks/useCommunity';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const REACTIONS = [
  { type: 'like', icon: Heart, label: 'Like', color: 'text-primary' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrate', color: 'text-brand-lime' },
  { type: 'support', icon: HandHeart, label: 'Support', color: 'text-secondary' },
  { type: 'insightful', icon: Lightbulb, label: 'Insightful', color: 'text-accent' },
] as const;

interface ReactionBarProps {
  post: CommunityPost;
}

export function ReactionBar({ post }: ReactionBarProps) {
  const { addReaction, removeReaction, hasUserReacted } = useCommunity();
  const [processingReactions, setProcessingReactions] = useState<Set<string>>(new Set());

  const handleReactionClick = async (reactionType: CommunityReaction['reaction_type']) => {
    // Prevent multiple clicks on same reaction type
    if (processingReactions.has(reactionType)) {
      return;
    }

    console.log('Reaction clicked:', reactionType, 'for post:', post.id);
    
    setProcessingReactions(prev => new Set(prev).add(reactionType));
    
    try {
      const userHasReacted = hasUserReacted(post, reactionType);
      console.log('User has reacted:', userHasReacted);
      
      if (userHasReacted) {
        console.log('Removing reaction...');
        await removeReaction(post.id, reactionType);
      } else {
        console.log('Adding reaction...');
        await addReaction(post.id, reactionType);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    } finally {
      setProcessingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(reactionType);
        return newSet;
      });
    }
  };

  const getReactionCount = (reactionType: CommunityReaction['reaction_type']) => {
    return post.reactions.filter(r => r.reaction_type === reactionType).length;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map((reaction) => {
        const Icon = reaction.icon;
        const count = getReactionCount(reaction.type);
        const userReacted = hasUserReacted(post, reaction.type);
        
        return (
          <Button
            key={reaction.type}
            variant={userReacted ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleReactionClick(reaction.type)}
            disabled={processingReactions.has(reaction.type)}
            className={cn(
              'h-8 px-3 text-xs hover:scale-105 transition-all duration-200',
              userReacted && `${reaction.color} bg-opacity-20 border-current`,
              !userReacted && 'hover:bg-muted/80 hover:text-foreground',
              processingReactions.has(reaction.type) && 'opacity-50 cursor-not-allowed'
            )}
            title={userReacted ? `Remove ${reaction.label} (${count})` : `Add ${reaction.label} (${count})`}
          >
            <Icon className={cn(
              'w-4 h-4',
              userReacted ? reaction.color : 'text-muted-foreground',
              count > 0 && 'mr-1'
            )} />
            {count > 0 && (
              <span className="font-medium">{count}</span>
            )}
            {count === 0 && !userReacted && (
              <span className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {reaction.label}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}