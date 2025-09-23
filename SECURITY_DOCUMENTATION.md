# Security Documentation

## Security Definer Views - Intentional Design

This application has 2 Security Definer views that are **intentionally designed** for gamification functionality:

### 1. `recent_points_activity` View
- **Purpose**: Displays recent gamification activity across users for public leaderboards
- **Why Security Definer**: Allows cross-user visibility for gamification engagement
- **Privacy Controls**: Only shows data from users who have opted into public leaderboard (`show_in_leaderboard = true`)
- **Security**: Users can control visibility via profile settings

### 2. `user_points_summary` View  
- **Purpose**: Aggregates points data for public leaderboards and competition
- **Why Security Definer**: Enables public gamification features and leaderboards
- **Privacy Controls**: Respects user privacy settings - only shows opted-in users
- **Security**: Users always see their own data + public data from consenting users

## Access Control System

### Authentication Flow
1. **JWT Verification**: All protected endpoints verify user authentication
2. **Payment Verification**: `user_has_valid_access()` function checks for:
   - Valid payments in `payments` table (status: 'paid' or 'demo')
   - Active subscriptions in `subscribers` table
   - Challenge period access (free trial)
3. **Default Deny**: Access denied if no valid payment/subscription found

### Database Security
- **Row Level Security (RLS)**: Enabled on all sensitive tables
- **User Isolation**: Users can only access their own data
- **Service Role Functions**: Backend functions use service role for admin operations
- **Encrypted Storage**: Payment data encrypted in `payment_vault` table

## Gamification Security

### Badge System
- **Automatic Awards**: Badges awarded based on objective criteria (contacts added, activities completed)
- **No User Manipulation**: Users cannot directly award themselves badges
- **Points Integration**: Badge earnings logged in points ledger for transparency

### Reward System
- **Probability-Based**: Variable rewards use configurable probability (default 10%)
- **Weighted Selection**: Rewards selected using weighted random algorithm
- **Audit Trail**: All rewards logged with timestamps and metadata

## Production Readiness Checklist

✅ **Authentication & Authorization**
- JWT-based authentication implemented
- Payment verification system active
- RLS policies secure user data

✅ **Error Handling**
- Global error boundary implemented
- Graceful degradation for API failures
- User-friendly error messages

✅ **Gamification**
- Real badge awarding system
- Variable rewards with proper probability
- Public leaderboards with privacy controls

✅ **Database Security**
- All sensitive tables have RLS
- Payment data encrypted
- Audit logging for sensitive operations

## Security Definer Views - Justification

The 2 Security Definer views are **acceptable** because:
1. **Limited Scope**: Only used for gamification, not sensitive business data
2. **User Consent**: Only shows data from users who opted into public visibility
3. **Privacy Controls**: Users can disable public visibility anytime
4. **No Sensitive Data**: Only shows gamification metrics, not personal/payment info
5. **Business Requirement**: Essential for competitive gamification features

These views enable core product features (leaderboards, social competition) while maintaining user privacy through opt-in controls.