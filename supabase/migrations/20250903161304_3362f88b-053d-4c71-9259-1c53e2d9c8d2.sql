-- Create sample help articles to populate the help management section
INSERT INTO public.content_pages (
  slug, 
  title, 
  content, 
  meta_description, 
  is_published, 
  created_by
) VALUES 
(
  'help-getting-started',
  'Getting Started with CRM',
  '# Getting Started with CRM

Welcome to our CRM platform! This comprehensive guide will help you get up and running quickly.

## Step 1: Complete Your Profile
Start by setting up your profile with your business information.

## Step 2: Import Your Contacts
Upload your existing contacts or add them manually to build your database.

## Step 3: Set Up Your First Campaign
Create your first outreach campaign to engage with prospects.

## Step 4: Track Your Progress
Use our analytics dashboard to monitor performance and optimize your approach.

## Need More Help?
Visit our other help articles or contact support for personalized assistance.',
  'Complete guide to getting started with our CRM platform.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'help-importing-contacts',
  'How to Import Contacts',
  '# How to Import Contacts

Learn how to efficiently import your contacts into the CRM system.

## Supported File Formats
- CSV files
- Excel spreadsheets (.xlsx, .xls)
- vCard files (.vcf)

## Required Fields
- **Name** (required)
- **Email** (required)
- Company
- Phone
- Position

## Step-by-Step Import Process

### 1. Prepare Your File
Ensure your file has the correct column headers matching our system.

### 2. Navigate to Contacts
Click on the "Contacts" section in the main navigation.

### 3. Click Import
Look for the "Import" button and click it.

### 4. Upload Your File
Select your prepared file and upload it.

### 5. Map Fields
Match the columns in your file to the fields in our system.

### 6. Review and Import
Review the mapping and click "Import" to complete the process.

## Tips for Success
- Always backup your data before importing
- Use consistent formatting for phone numbers
- Check for duplicate entries
- Verify email addresses are valid',
  'Step-by-step guide on how to import contacts into the CRM system.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'help-creating-campaigns',
  'Creating Effective Outreach Campaigns',
  '# Creating Effective Outreach Campaigns

Learn how to create and manage successful outreach campaigns.

## Campaign Types

### Email Campaigns
Perfect for reaching large audiences with personalized messages.

### Phone Campaigns
Direct approach for high-value prospects and warm leads.

### Social Media Outreach
Engage prospects on LinkedIn, Twitter, and other platforms.

## Campaign Setup

### 1. Define Your Audience
- Segment your contacts based on criteria
- Create targeted lists for better results

### 2. Craft Your Message
- Write compelling subject lines
- Personalize your content
- Include clear call-to-actions

### 3. Set Your Schedule
- Choose optimal sending times
- Plan follow-up sequences
- Set campaign duration

### 4. Launch and Monitor
- Start your campaign
- Track open rates and responses
- Make adjustments as needed

## Best Practices
- A/B test your messages
- Keep emails concise and valuable
- Follow up consistently but respectfully
- Track and analyze results

## Measuring Success
- Open rates
- Response rates
- Conversion rates
- Revenue generated',
  'Guide to creating and managing effective outreach campaigns.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'help-troubleshooting-login',
  'Troubleshooting Login Issues',
  '# Troubleshooting Login Issues

Having trouble logging in? Here are common solutions to get you back on track.

## Common Login Problems

### Forgot Password
1. Click "Forgot Password" on the login page
2. Enter your email address
3. Check your email for reset instructions
4. Follow the link to create a new password

### Account Locked
If you have made too many failed login attempts, your account may be temporarily locked.
- Wait 15 minutes and try again
- Contact support if the issue persists

### Email Not Recognized
- Double-check your email address for typos
- Make sure you are using the email associated with your account
- Try your alternate email addresses

### Browser Issues
- Clear your browser cache and cookies
- Try logging in with an incognito/private window
- Update your browser to the latest version
- Disable browser extensions that might interfere

## Still Having Issues?

### Check Your Internet Connection
Make sure you have a stable internet connection.

### Try a Different Device
Sometimes device-specific issues can cause problems.

### Contact Support
If none of these solutions work, please contact our support team with:
- Your email address
- Description of the problem
- Any error messages you see
- Your browser and device information

We are here to help get you back to managing your relationships!',
  'Solutions for common login problems and account access issues.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'help-managing-contacts',
  'Managing Your Contacts',
  '# Managing Your Contacts

Learn how to effectively organize and manage your contacts in the CRM.

## Contact Organization

### Contact Categories
Organize contacts by:
- **Lead Status**: Hot, Warm, Cold
- **Relationship Type**: Lead, Client, Partner
- **Industry**: Technology, Healthcare, Finance, etc.
- **Source**: Website, Referral, Event, etc.

### Contact Fields
Key information to track:
- Basic info (name, email, phone)
- Company details
- Position/Role
- Social media profiles
- Notes and interaction history

## Contact Management Features

### Adding Contacts
- Add individual contacts manually
- Import contacts from files
- Capture leads from web forms

### Updating Contact Information
- Edit contact details anytime
- Track communication history
- Add notes and tags

### Contact Lists
- Create custom contact lists
- Filter contacts by criteria
- Export contact data

## Best Practices

### Keep Information Current
- Regular data cleanup
- Update contact status
- Remove duplicates

### Track Interactions
- Log all communications
- Set follow-up reminders
- Note important details

### Use Tags and Categories
- Consistent tagging system
- Meaningful categories
- Regular organization

## Advanced Features

### Contact Scoring
Rank contacts based on engagement and potential value.

### Automated Workflows
Set up automatic actions based on contact behavior.

### Integration with Other Tools
Connect with email, calendar, and social media tools.',
  'Complete guide to organizing and managing contacts in your CRM.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'help-api-documentation',
  'API Documentation',
  '# API Documentation

Access our CRM data programmatically using our RESTful API.

## Getting Started

### Authentication
All API requests require authentication using API keys.

```
Authorization: Bearer YOUR_API_KEY
```

### Base URL
```
https://api.yourcrm.com/v1/
```

## Endpoints

### Contacts

#### Get All Contacts
```
GET /contacts
```

#### Get Contact by ID
```
GET /contacts/{id}
```

#### Create Contact
```
POST /contacts
```

#### Update Contact
```
PUT /contacts/{id}
```

#### Delete Contact
```
DELETE /contacts/{id}
```

### Campaigns

#### Get All Campaigns
```
GET /campaigns
```

#### Create Campaign
```
POST /campaigns
```

#### Get Campaign Results
```
GET /campaigns/{id}/results
```

## Request Examples

### Create a Contact
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Example Corp",
  "phone": "+1-555-0123",
  "status": "lead"
}
```

### Create a Campaign
```json
{
  "name": "Q4 Outreach",
  "type": "email",
  "subject": "Special Q4 Offer",
  "content": "Email content here...",
  "recipients": ["contact_id_1", "contact_id_2"]
}
```

## Rate Limits
- 1000 requests per hour per API key
- 10 requests per second

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Support
For API support, contact our developer team at api-support@yourcrm.com',
  'Complete API documentation for developers to integrate with our CRM system.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
);