import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Calculator
} from 'lucide-react';
import { useAIQuota } from '@/hooks/useAIQuota';

interface TokenBreakdownCardProps {
  inputText?: string;
  className?: string;
}

export function TokenBreakdownCard({ inputText = '', className }: TokenBreakdownCardProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    quota,
    recentUsage,
    formatTokens,
    estimateTokensFromInput,
    getAverageTokenUsage,
    getTokenBreakdown
  } = useAIQuota();

  const averageUsage = getAverageTokenUsage();
  const breakdown = getTokenBreakdown();
  const estimatedTokens = inputText ? estimateTokensFromInput(inputText) : null;

  if (!quota) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Token Usage Insights
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs h-6"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {/* Dynamic Token Estimate */}
          {estimatedTokens && (
            <div className="p-3 rounded-lg border bg-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Estimated for Current Input</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Input tokens</div>
                  <div className="font-medium">{formatTokens(estimatedTokens - 800 - 300)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">System + Output</div>
                  <div className="font-medium">{formatTokens(800 + 300)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total estimate</div>
                  <div className="font-semibold">{formatTokens(estimatedTokens)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Average Usage */}
          {averageUsage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Average Usage ({averageUsage.count} recent requests)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-muted-foreground">Input</div>
                  <div className="font-medium">{formatTokens(averageUsage.prompt)}</div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-muted-foreground">Output</div>
                  <div className="font-medium">{formatTokens(averageUsage.completion)}</div>
                </div>
                <div className="text-center p-2 rounded bg-primary/10">
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatTokens(averageUsage.total)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-medium">This Month's Usage Breakdown</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Input tokens (prompts)</span>
                  <span>{formatTokens(breakdown.totalPrompt)}</span>
                </div>
                <Progress value={breakdown.totalPrompt / (breakdown.totalPrompt + breakdown.totalCompletion) * 100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Output tokens (AI responses)</span>
                  <span>{formatTokens(breakdown.totalCompletion)}</span>
                </div>
                <Progress value={breakdown.totalCompletion / (breakdown.totalPrompt + breakdown.totalCompletion) * 100} className="h-1" />
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Average per request</span>
                  <Badge variant="secondary">{formatTokens(breakdown.averagePerRequest)}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Usage History */}
          {recentUsage.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Recent Requests</span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentUsage.slice(0, 5).map((usage, index) => (
                  <div key={usage.id || index} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      <span>{new Date(usage.created_at).toLocaleTimeString()}</span>
                      {!usage.success && <Badge variant="destructive" className="text-xs">Failed</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {formatTokens(usage.tokens_prompt || 0)} + {formatTokens(usage.tokens_completion || 0)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatTokens(usage.tokens_total || 0)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Efficiency Tips */}
          <div className="p-3 rounded-lg bg-accent/5 border-l-4 border-accent">
            <div className="text-sm font-medium mb-1">💡 Token Efficiency Tips</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Shorter, more focused prompts use fewer input tokens</li>
              <li>• The 1500 token estimate includes system prompts (~800 tokens)</li>
              <li>• Actual usage is typically {averageUsage ? `${formatTokens(averageUsage.total)}` : '1200-1400'} tokens per request</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}