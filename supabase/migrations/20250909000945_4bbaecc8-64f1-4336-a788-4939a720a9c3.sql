-- Insert the Contact Categories introduction email template
INSERT INTO public.email_templates (
  template_key,
  name,
  subject,
  html_content,
  text_content,
  description,
  variables,
  is_active,
  created_by
) VALUES (
  'introduce_contact_categories_v1',
  'Introduce Contact Categories Feature',
  'Organize Your Contacts with Categories 🗂',
  '<center style="width: 100%; background: #f9f9f9; padding: 20px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 8px; box-shadow: 0 3px 8px rgba(0,0,0,0.1);"><!-- Header -->
<tbody>
<tr>
<td align="center" style="background: #f5518d; padding: 30px 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
<h1 style="margin: 0; font-size: 24px; color: #ffffff;">🗂 Organize with Contact Categories</h1>
<p style="margin: 8px 0 0; font-size: 15px; color: #ffffff;">Use icons + colors to make your contact list effortless to navigate.</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding: 25px; font-size: 15px; color: #00343a;">
<p>Hi {{first_name}},</p>
<p><strong>Did you know?</strong> PinkWizard includes <strong>Contact Categories</strong> — a simple way to classify your contacts beyond just relationship or lead status. With icon + color badges, your contact book becomes easier to scan, filter, and act on.</p>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px;">Where to find them</h2>
<p>Go to <em>Settings → Categories</em> or open the link below:</p>
<p><a href="https://www.pink-wizard.com/settings" target="_blank" style="color: #f5518d; font-weight: bold; text-decoration: underline;" rel="noopener noreferrer">www.pink-wizard.com/settings</a></p>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px;">Why use categories</h2>
<ul style="margin: 0; padding-left: 18px;">
<li>Visual segmentation with icons and colors</li>
<li>Filter by category in your contact list</li>
<li>Bulk‑update categories for selected contacts</li>
<li>Cleaner reporting and focused follow‑up targeting</li>
</ul>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">How it works</h2>
<ol style="margin: 0; padding-left: 20px;">
<li>Navigate to <em>Settings → Categories → Add New Category</em></li>
<li>Pick an icon + color, give it a label</li>
<li>Save — badges instantly show on your contacts</li>
</ol>
<p style="margin-top: 16px;">We''ve pre‑seeded a starter set that includes <strong>"Uncategorized."</strong> If you delete a category, any contacts assigned to it automatically move to <em>Uncategorized</em> — so nothing gets lost.</p>
<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
<tbody>
<tr>
<td align="center" bgcolor="#f5518d" style="border-radius: 6px;"><a href="https://www.pink-wizard.com/settings" target="_blank" style="display: block; padding: 14px 28px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; border-radius: 6px; background-color: #f5518d;" rel="noopener noreferrer"> 🗂 Go to Categories Settings </a></td>
</tr>
</tbody>
</table>
<p style="margin-top: 10px;">Try customizing a few categories today — it''s a quick win that makes staying organized and consistent a whole lot easier.</p>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="padding: 20px; text-align: center; font-size: 13px; color: #666;"> </td>
</tr>
</tbody>
</table>
</center>',
  'Hi {{first_name}},

Did you know? PinkWizard includes Contact Categories — a simple way to classify your contacts beyond just relationship or lead status. With icon + color badges, your contact book becomes easier to scan, filter, and act on.

WHERE TO FIND THEM
Go to Settings → Categories or visit: https://www.pink-wizard.com/settings

WHY USE CATEGORIES
• Visual segmentation with icons and colors
• Filter by category in your contact list
• Bulk-update categories for selected contacts  
• Cleaner reporting and focused follow-up targeting

HOW IT WORKS
1. Navigate to Settings → Categories → Add New Category
2. Pick an icon + color, give it a label
3. Save — badges instantly show on your contacts

We''ve pre-seeded a starter set that includes "Uncategorized." If you delete a category, any contacts assigned to it automatically move to Uncategorized — so nothing gets lost.

Try customizing a few categories today — it''s a quick win that makes staying organized and consistent a whole lot easier.

Go to Categories Settings: https://www.pink-wizard.com/settings',
  'Email introducing the Contact Categories feature to help users organize their contacts with visual icons and colors.',
  '{"first_name": "The user''s first name extracted from display_name or email"}',
  true,
  (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  updated_at = NOW();