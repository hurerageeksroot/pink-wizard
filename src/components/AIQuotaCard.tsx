import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAIQuota } from '@/hooks/useAIQuota';

export function AIQuotaCard() {
  const {
    quota,
    loading,
    error,
    tokenPacks,
    fetchQuota,
    buyTokens,
    getRemainingPercentage,
    formatTokens,
    getTierColor,
    canMakeRequest,
    getAverageTokenUsage
  } = useAIQuota();

  if (loading && !quota) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-border bg-card w-full max-w-2xl">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">AI Usage</span>
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
          <div className="h-2 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-destructive bg-destructive/5 w-full max-w-2xl">
        <div className="flex items-center gap-2 flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">AI Usage Error</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground truncate">{error}</span>
        </div>
        <Button 
          onClick={fetchQuota}
          variant="outline" 
          size="sm" 
          className="text-xs h-7 flex-shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const remainingPercentage = getRemainingPercentage();
  const isLowTokens = remainingPercentage < 20;
  const canGenerate = canMakeRequest();
  const isAdmin = quota?.tier === 'Admin';
  const isChallengeParticipant = quota?.tier === 'Challenge Participant';
  const hasUnlimitedQuota = isAdmin || isChallengeParticipant;

  return (
    <div className={`flex items-center gap-4 px-4 py-2 rounded-lg border ${!hasUnlimitedQuota && (isLowTokens || !canGenerate) ? "border-orange-200 bg-orange-50/50" : "border-border bg-card"} w-full max-w-2xl`}>
      {/* AI Usage Label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">AI Usage</span>
        <Badge variant="secondary" className={`text-xs ${getTierColor(quota.tier)}`}>
          {quota.tier}
        </Badge>
      </div>

        {/* Usage Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {hasUnlimitedQuota ? 'Unlimited' : `${formatTokens(quota.remaining)} / ${formatTokens(quota.monthly_quota + quota.credits_remaining)} available`}
            </span>
            <span className="text-muted-foreground">
              {hasUnlimitedQuota ? 'No limits' : `Avg: ${getAverageTokenUsage()?.total ? formatTokens(getAverageTokenUsage()?.total) : '~1.4k'}/req`}
            </span>
          </div>
          <Progress 
            value={hasUnlimitedQuota ? 100 : remainingPercentage} 
            className={`h-2 ${hasUnlimitedQuota ? 'bg-green-100' : (isLowTokens ? 'bg-orange-100' : '')}`}
          />
        </div>

      {/* Warning Icon */}
      {!hasUnlimitedQuota && (isLowTokens || !canGenerate) && (
        <div className="flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!hasUnlimitedQuota && (isLowTokens || !canGenerate) && (
          <Button
            onClick={() => buyTokens('growth')}
            size="sm"
            className="text-xs h-7"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Buy Tokens
          </Button>
        )}
        <Button 
          onClick={fetchQuota}
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 opacity-60 hover:opacity-100"
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}