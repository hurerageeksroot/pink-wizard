# Parent App Integration Guide

This document explains how to embed the PinkWizard app and integrate revenue syncing and outreach counts via postMessage.

## Option A: Full SSO Integration (Complete Functionality)

If you want full functionality with user authentication:

```jsx
import React, { useEffect, useRef } from 'react';

const PinkWizardEmbed = ({ ssoToken, onMessage }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      // Handle messages from PinkWizard iframe
      if (event.data?.type === 'REQUEST_SSO_TOKEN') {
        // Send SSO token to child app
        event.source.postMessage({
          type: 'SSO_TOKEN_RESPONSE',
          token: ssoToken
        }, event.origin);
      }
      
      // Forward other messages to parent component
      onMessage?.(event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [ssoToken, onMessage]);

  return (
    <iframe
      ref={iframeRef}
      src="https://warm-reach-wiz.lovable.app"
      style={{ width: '100%', height: '800px', border: 'none' }}
      title="PinkWizard CRM"
    />
  );
};
```

## Option B: Daily Counts Only (Read-Only Mode)

If you only want to display daily outreach counts without full authentication:

```jsx
import React, { useEffect, useRef } from 'react';

const PinkWizardCountsEmbed = ({ dailyOutreachData }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'REQUEST_PINKWIZARD_OUTREACH_COUNTS') {
        console.log('Child app requesting outreach counts');
        
        // Send daily outreach counts to child app
        event.source.postMessage({
          type: 'PINKWIZARD_OUTREACH_COUNTS',
          payload: {
            day: dailyOutreachData.currentDay,
            coldOutreach: dailyOutreachData.coldCount,
            nurturingOutreach: dailyOutreachData.nurturingCount,
            totalOutreach: dailyOutreachData.totalCount,
            lastUpdated: new Date().toISOString()
          }
        }, event.origin);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dailyOutreachData]);

  // Send updated counts when data changes
  useEffect(() => {
    if (iframeRef.current && dailyOutreachData) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'PINKWIZARD_OUTREACH_COUNTS',
        payload: {
          day: dailyOutreachData.currentDay,
          coldOutreach: dailyOutreachData.coldCount,
          nurturingOutreach: dailyOutreachData.nurturingCount,
          totalOutreach: dailyOutreachData.totalCount,
          lastUpdated: new Date().toISOString()
        }
      }, '*');
    }
  }, [dailyOutreachData]);

  return (
    <div className="pinkwizard-embed">
      <iframe
        ref={iframeRef}
        src="https://warm-reach-wiz.lovable.app"
        style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px' }}
        title="PinkWizard Outreach Tracker"
      />
    </div>
  );
};

// Usage example
const MyDashboard = () => {
  const [outreachData, setOutreachData] = useState({
    currentDay: 15,
    coldCount: 8,
    nurturingCount: 12,
    totalCount: 20
  });

  return (
    <div>
      <h1>75 Hard Challenge Dashboard</h1>
      <PinkWizardCountsEmbed dailyOutreachData={outreachData} />
    </div>
  );
};
```

## Guaranteed Rewards Integration

PinkWizard now supports milestone-based guaranteed rewards that users earn automatically when reaching thresholds:

```jsx
const PinkWizardGuaranteedRewardsIntegration = ({ onGuaranteedRewardEarned }) => {
  useEffect(() => {
    const handleMessage = (event) => {
      // Handle guaranteed reward earned events
      if (event.data?.type === 'PINKWIZARD_GUARANTEED_REWARD_EARNED') {
        const { rewardId, rewardName } = event.data.payload;
        console.log(`Guaranteed reward earned: ${rewardName}`);
        onGuaranteedRewardEarned?.({
          type: 'guaranteed_reward_earned',
          rewardId,
          rewardName,
          timestamp: event.data.payload.timestamp
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onGuaranteedRewardEarned]);

  return (
    <iframe
      src="https://warm-reach-wiz.lovable.app"
      style={{ width: '100%', height: '800px', border: 'none' }}
      title="PinkWizard CRM"
    />
  );
};
```

### Guaranteed Reward Events
```typescript
interface GuaranteedRewardEarnedEvent {
  rewardId: string;           // Unique reward definition identifier
  rewardName: string;         // Name of the reward earned
  timestamp: string;          // ISO timestamp when earned
}
```

## Revenue Syncing Integration

PinkWizard now sends revenue events to the parent app for real-time syncing:

```jsx
const PinkWizardRevenueIntegration = ({ onRevenueUpdate }) => {
  useEffect(() => {
    const handleMessage = (event) => {
      // Handle individual revenue logging events  
      if (event.data?.type === 'PINKWIZARD_REVENUE_LOGGED') {
        const { contactId, contactName, revenue, challengeDay } = event.data.payload;
        console.log(`Revenue logged: $${revenue} from ${contactName}`);
        onRevenueUpdate?.({
          type: 'revenue_logged',
          amount: revenue,
          contactName,
          day: challengeDay
        });
      }

      // Handle contact won events with lifetime value
      if (event.data?.type === 'PINKWIZARD_CONTACT_WON') {
        const { contactName, revenue, totalLifetimeValue } = event.data.payload;
        console.log(`Contact won: ${contactName}, LTV: $${totalLifetimeValue}`);
        onRevenueUpdate?.({
          type: 'contact_won',
          contactName,
          newRevenue: revenue,
          lifetimeValue: totalLifetimeValue
        });
      }

      // Handle daily revenue updates (recommended for leaderboard sync)
      if (event.data?.type === 'PINKWIZARD_DAILY_REVENUE_UPDATE') {
        const { day, totalRevenue, eventCount } = event.data.payload;
        console.log(`Daily revenue update: Day ${day}, Total: $${totalRevenue}`);
        
        // This is the most important event for leaderboard accuracy
        onRevenueUpdate?.({
          type: 'daily_total',
          day,
          totalRevenue,
          eventCount
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRevenueUpdate]);

  return (
    <iframe
      src="https://warm-reach-wiz.lovable.app"
      style={{ width: '100%', height: '800px', border: 'none' }}
      title="PinkWizard CRM"
    />
  );
};
```

## Payload Schemas

### Outreach Counts
```typescript
interface ExternalOutreachCounts {
  day: number;              // Current challenge day (1-75)
  coldOutreach: number;     // Count of cold outreach activities
  nurturingOutreach: number; // Count of nurturing outreach activities  
  totalOutreach: number;    // Total outreach count (cold + nurturing)
  lastUpdated: string;      // ISO timestamp of when counts were last updated
}
```

### Revenue Events
```typescript
interface RevenueLoggedEvent {
  contactId: string;        // Unique contact identifier
  contactName: string;      // Contact display name
  revenue: number;          // Revenue amount in dollars
  notes?: string;           // Optional notes about the deal
  challengeDay: number;     // Challenge day when logged
  timestamp: string;        // ISO timestamp of when logged
}

interface ContactWonEvent {
  contactId: string;        // Unique contact identifier
  contactName: string;      // Contact display name
  revenue: number;          // New revenue amount
  totalLifetimeValue: number; // Contact's total lifetime value
  timestamp: string;        // ISO timestamp
}

interface DailyRevenueData {
  day: number;              // Challenge day
  totalRevenue: number;     // Total revenue for the day
  eventCount: number;       // Number of events/deals closed
  lastUpdated: string;      // ISO timestamp
}
```

## Event Flow

### Outreach Sync
1. **Child App Loads**: PinkWizard iframe loads and detects it's in an iframe
2. **Request Counts**: Child sends `REQUEST_PINKWIZARD_OUTREACH_COUNTS` message
3. **Parent Responds**: Parent sends `PINKWIZARD_OUTREACH_COUNTS` with current data
4. **Display**: Child displays the counts in embedded mode
5. **Updates**: Parent can send updated counts whenever data changes

### Revenue Sync (New)
1. **Revenue Logged**: User logs revenue in PinkWizard
2. **Individual Event**: Child sends `PINKWIZARD_REVENUE_LOGGED` to parent
3. **Contact Won Event**: Child sends `PINKWIZARD_CONTACT_WON` with lifetime value
4. **Daily Update**: Child sends `PINKWIZARD_DAILY_REVENUE_UPDATE` with day totals
5. **Parent Updates**: Parent updates leaderboard/totals based on daily revenue data

### Recommended Leaderboard Integration
For accurate leaderboard calculations, use the `PINKWIZARD_DAILY_REVENUE_UPDATE` events as they provide cumulative daily totals, preventing the overwrite issue you mentioned:

```javascript
// Handle daily revenue updates for leaderboard
if (event.data?.type === 'PINKWIZARD_DAILY_REVENUE_UPDATE') {
  const { day, totalRevenue } = event.data.payload;
  
  // Update your user's daily revenue total (replaces previous day total)
  updateUserDailyRevenue(userId, day, totalRevenue);
  
  // Recalculate leaderboard rankings
  recalculateLeaderboard();
}

## Testing

To test the integration:

1. Open browser developer tools
2. Look for console messages starting with `[ExternalCountsBridge]`
3. Check that the embedded mode banner appears
4. Verify that outreach counts display correctly
5. Test that updates from parent reflect in the iframe

## Troubleshooting

- **No counts showing**: Check console for postMessage errors
- **CORS issues**: Ensure iframe src matches expected origin
- **Counts not updating**: Verify payload schema matches exactly
- **Debug mode**: In development, the bridge status indicator shows in bottom-right corner

## Security Considerations

- Use specific origin instead of `'*'` in production
- Validate message origins before processing
- Consider rate limiting message frequency
- Sanitize data before sending to iframe