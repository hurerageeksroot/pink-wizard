import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Medal, Crown, Target, Calendar, Zap, Users, UserPlus, DollarSign, Gem } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

const iconMap = {
  Trophy,
  Star, 
  Medal,
  Crown,
  Target,
  Calendar,
  Zap,
  Users,
  UserPlus,
  DollarSign,
  Gem
};

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  image_url?: string;
  category: 'milestone' | 'consistency' | 'performance' | 'special';
  rarity: string;
  points_reward: number;
  earned_at?: string;
}

export function BadgeDisplay() {
  const { badges, loading, fetchBadges } = useGamification();

  console.log('BadgeDisplay - badges:', badges, 'loading:', loading);

  const handleRefresh = () => {
    fetchBadges();
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-lg font-bold">Your Badges</span>
              <div className="text-sm text-muted-foreground font-normal">
                Loading your achievements...
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading badges...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-lg font-bold">Your Badges</span>
              <div className="text-sm text-muted-foreground font-normal">
                No achievements yet
              </div>
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="ghost" 
              size="sm"
              className="hover:bg-primary/10"
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No badges yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add contacts and start reaching out to earn your first achievement badge
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-br from-yellow-500 to-orange-600';
      case 'epic': return 'bg-gradient-to-br from-purple-600 to-pink-600';
      case 'rare': return 'bg-gradient-to-br from-blue-600 to-cyan-700';
      default: return 'bg-gradient-to-br from-slate-600 to-slate-700';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-lg font-bold">Your Badges</span>
            <div className="text-sm text-muted-foreground font-normal">
              {badges.length} achievement{badges.length !== 1 ? 's' : ''} unlocked
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm"
            className="hover:bg-primary/10"
          >
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-6">
          {badges.map((badge: any) => {
            const IconComponent = iconMap[badge.icon_name as keyof typeof iconMap] || Trophy;
            
            return (
              <div
                key={badge.id}
                className="group relative overflow-hidden rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-fade-in"
              >
                {/* Glow effect */}
                <div className={`absolute -inset-1 ${getRarityColor(badge.rarity)} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300`} />
                
                <div className="relative p-6">
                  {/* Header with icon and rarity */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${
                      badge.image_url 
                        ? 'bg-white dark:bg-gray-100 shadow-md' 
                        : getRarityColor(badge.rarity)
                    } shadow-lg`}>
                      {badge.image_url ? (
                        <img 
                          src={badge.image_url} 
                          alt={badge.name} 
                          className="w-12 h-12 object-contain rounded-full"
                        />
                      ) : (
                        <IconComponent className="w-10 h-10 text-white" />
                      )}
                      {/* Pulse ring for rare badges */}
                      {['rare', 'epic', 'legendary'].includes(badge.rarity) && !badge.image_url && (
                        <div className={`absolute inset-0 rounded-full ${getRarityColor(badge.rarity)} animate-pulse opacity-50`} />
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        className={`text-xs font-medium px-2 py-1 border ${getRarityBadgeColor(badge.rarity)}`}
                      >
                        {badge.rarity}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="text-xs px-2 py-1 bg-muted/50 border-muted-foreground/20 text-muted-foreground"
                      >
                        {badge.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors duration-200">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {badge.description}
                      </p>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                          <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-300 fill-current" />
                        </div>
                        <span className="text-sm font-semibold text-card-foreground">{badge.points_reward}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                      {badge.earned_at && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                          {new Date(badge.earned_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shimmer effect */}
                {['rare', 'epic', 'legendary'].includes(badge.rarity) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}