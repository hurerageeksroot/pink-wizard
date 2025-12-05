import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Calendar, Trophy, Clock, CheckCircle } from "lucide-react";
import { useChallenge } from "@/hooks/useChallenge";

interface ChallengeAccessGateProps {
  children: React.ReactNode;
  feature: "challenge_tasks" | "community" | "leaderboards" | "rewards";
  fallback?: React.ReactNode;
}

export const ChallengeAccessGate: React.FC<ChallengeAccessGateProps> = ({
  children,
  feature,
  fallback,
}) => {
  const { isActive, startDate, isChallengeParticipant, loading } =
    useChallenge();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading challenge data...
          </p>
        </div>
      </div>
    );
  }

  // Allow access to rewards for participants even before challenge starts, but gate challenge_tasks by start date
  if (feature === "rewards" && isChallengeParticipant) {
    return <>{children}</>;
  }

  // If challenge is active and user is participant, allow access
  if (isActive && isChallengeParticipant) {
    return <>{children}</>;
  }

  // If user is not a challenge participant, show limited access message
  if (!isChallengeParticipant) {
    return (
      fallback || (
        <Card
          className="border-muted"
          style={{ height: "100%", borderColor: "var(--borderLight)" }}
        >
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted rounded-full">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl">Challenge Feature</CardTitle>
            <CardDescription>
              This feature is exclusive to 75 Hard Mobile Bar Challenge
              participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Join the challenge to unlock this feature and compete with other
              mobile bar professionals!
            </p>
          </CardContent>
        </Card>
      )
    );
  }

  // If challenge hasn't started yet, show pre-start message
  const startDateFormatted = startDate
    ? new Date(startDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "September 8th, 2024";

  const featureNames = {
    challenge_tasks: "Challenge Tasks",
    community: "Challenge Community",
    leaderboards: "Live Leaderboards",
    rewards: "Reward System",
  };

  const featureDescriptions = {
    challenge_tasks:
      "Your daily tasks and challenges will be available once the 75-day journey officially begins.",
    community:
      "Connect and compete with other challenge participants when the challenge goes live.",
    leaderboards:
      "Real-time rankings for points, revenue, and networking will activate on challenge start.",
    rewards:
      "Badge earning and prize competitions begin when the challenge officially starts.",
  };

  return (
    fallback || (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-full">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-xl">{featureNames[feature]}</CardTitle>
            <Badge variant="outline" className="border-primary text-primary">
              <Clock className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
          <CardDescription>Unlocks on {startDateFormatted}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-primary/30 bg-primary/10">
            <Trophy className="h-4 w-4" />
            <AlertDescription>
              <strong>75 Hard Mobile Bar Challenge (Holiday Edition)</strong>{" "}
              starts {startDateFormatted}!
            </AlertDescription>
          </Alert>

          <p className="text-sm text-center text-muted-foreground">
            {featureDescriptions[feature]}
          </p>

          <div className="bg-background/50 rounded-lg p-4 border">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1">What you can do now:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete onboarding tasks (earn early points!)</li>
                  <li>• Set up your business profile</li>
                  <li>• Import your contacts</li>
                  <li>• Explore platform features</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Get Ready for Challenge Start
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  );
};
