import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Users, DollarSign, Network, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ChallengePrizeManager: React.FC = () => {
  const [awarding, setAwarding] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);
  const { toast } = useToast();

  const handleAwardPrizes = async () => {
    setAwarding(true);
    setLastResults(null);

    try {
      const { data, error } = await supabase.rpc('award_challenge_prizes');

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; winners: Array<{ category: string; winner: string; value: number; prize: string }>; message: string };
      setLastResults(result);
      toast({
        title: "Challenge Prizes Awarded! 🏆",
        description: `Successfully awarded prizes to ${result.winners?.length || 0} winners.`
      });
    } catch (error: any) {
      console.error('Prize award error:', error);
      toast({
        title: "Prize Award Failed",
        description: error.message || "Failed to award challenge prizes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAwarding(false);
    }
  };

  const prizeCategories = [
    {
      icon: Trophy,
      title: 'Top Points Leader',
      description: 'Most points earned throughout the challenge',
      prize: 'Custom Yeti Water Bottle - Points Champion'
    },
    {
      icon: DollarSign,
      title: 'Top Revenue Generator',
      description: 'Highest total revenue from won contacts',
      prize: 'Custom Yeti Water Bottle - Revenue Champion'
    },
    {
      icon: Network,
      title: 'Top Networking Champion',
      description: 'Most networking contacts added during challenge',
      prize: 'Custom Yeti Water Bottle - Networking Champion'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <CardTitle>Challenge Prize Manager</CardTitle>
        </div>
        <CardDescription>
          Award custom Yeti water bottles to challenge winners
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prizeCategories.map((category, index) => (
            <Card key={index} className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                    <category.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-2">{category.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {category.prize}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Trophy className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Prize Award Process:</p>
            <ul className="text-sm space-y-1">
              <li>• Analyzes current leaderboard standings</li>
              <li>• Identifies top performer in each category</li>
              <li>• Records winners in admin audit log</li>
              <li>• Creates notifications for prize fulfillment</li>
            </ul>
          </AlertDescription>
        </Alert>

        {lastResults && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p><strong>Prize Award Results:</strong></p>
                {lastResults.winners && lastResults.winners.length > 0 ? (
                  <div className="space-y-2">
                    {lastResults.winners.map((winner: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">{winner.category}:</span> {winner.winner}
                        </div>
                        <Badge variant="outline">
                          {winner.category === 'Points Leader' && `${winner.value} points`}
                          {winner.category === 'Revenue Leader' && `$${winner.value}`}
                          {winner.category === 'Networking Leader' && `${winner.value} contacts`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">No winners found (challenge may not have active participants yet).</p>
                )}
                <p className="text-sm text-muted-foreground">{lastResults.message}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This will analyze current leaderboard standings and officially award prizes to the top performers. 
            Make sure the challenge period has ended before awarding final prizes.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button 
            onClick={handleAwardPrizes}
            disabled={awarding}
            className="flex-1"
          >
            {awarding ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Awarding Prizes...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Award Challenge Prizes
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Prize awards are recorded in the admin audit log. You'll need to manually fulfill the physical prize delivery based on these records.</p>
        </div>
      </CardContent>
    </Card>
  );
};