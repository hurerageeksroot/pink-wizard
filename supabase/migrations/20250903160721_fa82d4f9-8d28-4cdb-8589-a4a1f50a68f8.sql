-- Create sample content pages to populate the content management section
-- First, we need to get an admin user ID to use as created_by
INSERT INTO public.content_pages (
  slug, 
  title, 
  content, 
  meta_description, 
  is_published, 
  created_by
) VALUES 
(
  'about-us',
  'About Us', 
  '# About Our Company

We are a leading CRM platform that helps businesses manage their customer relationships effectively.

## Our Mission
To provide powerful, easy-to-use tools that help businesses grow and maintain strong customer relationships.

## Our Values
- Customer Success
- Innovation
- Transparency
- Reliability

## Contact Information
For more information, please reach out to our team.',
  'Learn about our company mission, values, and how we help businesses grow.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'privacy-policy',
  'Privacy Policy',
  '# Privacy Policy

Last updated: [Date]

## Information We Collect
We collect information you provide directly to us, such as when you create an account or contact us.

## How We Use Your Information
We use the information we collect to provide, maintain, and improve our services.

## Information Sharing
We do not sell, trade, or otherwise transfer your personal information to third parties.

## Data Security  
We implement appropriate security measures to protect your personal information.

## Contact Us
If you have questions about this Privacy Policy, please contact us.',
  'Our privacy policy explaining how we collect, use, and protect your personal information.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'terms-of-service',
  'Terms of Service',
  '# Terms of Service

Last updated: [Date]

## Acceptance of Terms
By accessing and using this service, you accept and agree to be bound by the terms of this agreement.

## Use License
Permission is granted to temporarily access the materials on our website for personal, non-commercial use only.

## Disclaimer
The materials on our website are provided on an "as is" basis. We make no warranties, expressed or implied.

## Limitations
In no event shall our company be liable for any damages arising out of the use or inability to use the materials.

## Contact Information
For questions about these Terms, please contact our legal department.',
  'Terms of service governing the use of our platform and services.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'getting-started',
  'Getting Started Guide',
  '# Getting Started with Our CRM

Welcome to our CRM platform! This guide will help you get up and running quickly.

## Step 1: Set Up Your Profile
Complete your profile information to personalize your experience.

## Step 2: Import Your Contacts
Upload your existing contacts or add them manually to start building your database.

## Step 3: Create Your First Campaign
Set up your first outreach campaign to engage with your contacts.

## Step 4: Track Your Progress
Use our analytics dashboard to monitor your campaign performance.

## Need Help?
Check out our help section or contact support for assistance.',
  'Complete guide to getting started with our CRM platform.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
),
(
  'help-center',
  'Help Center',
  '# Help Center

Find answers to frequently asked questions and get help with common issues.

## Frequently Asked Questions

### How do I reset my password?
Click on the "Forgot Password" link on the login page and follow the instructions.

### How do I import contacts?
Navigate to the Contacts section and click the "Import" button to upload a CSV file.

### How do I create a new campaign?
Go to the Campaigns section and click "New Campaign" to get started.

### How do I contact support?
You can reach our support team through the contact form or by email.

## Still Need Help?
If you cannot find the answer to your question, please contact our support team.',
  'Help center with answers to common questions and support information.',
  true,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
);