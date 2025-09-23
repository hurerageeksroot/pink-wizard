-- Insert the warm outreach email template
INSERT INTO public.email_templates (
  template_key,
  name,
  subject,
  html_content,
  text_content,
  variables,
  description,
  is_active
) VALUES (
  'introduce_warm_outreach_v1',
  'Warm Outreach Power Guide',
  'Tap into Your Warm Network - It''s Your Secret Weapon',
  '<center style="width: 100%; background: #f9f9f9; padding: 20px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 8px; box-shadow: 0 3px 8px rgba(0,0,0,0.1);"><!-- Header -->
<tbody>
<tr>
<td align="center" style="background: #f5518d; padding: 30px 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
<h1 style="margin: 0; font-size: 24px; color: #ffffff;">🔥 Tap into Your Warm Network</h1>
<p style="margin: 8px 0 0; font-size: 15px; color: #ffffff;">PinkWizard makes warm outreach practical, consistent, and effective.</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding: 25px; font-size: 15px; color: #00343a;">
<p>Hi {{user_name}},</p>
<p>Cold outreach has its place, but it rarely outperforms a simple truth: the people who already know, like, and trust you are far more likely to support you. <strong>Warm outreach consistently delivers better results</strong> IF you know how to work it. PinkWizard helps you turn this hidden advantage into a repeatable system.</p>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px;">Why warm works</h2>
<p>Your warm contacts already recognize your name and respect your experience. That means interactions start further along the trust curve and momentum builds quickly.</p>
<ul style="margin: 0; padding-left: 18px;">
<li><strong>Trust advantage:</strong> conversations skip the "prove yourself" stage</li>
<li><strong>Faster cycles:</strong> shorter time from hello to yes/no</li>
<li><strong>Compounding goodwill:</strong> each connection strengthens the relationship for next time</li>
</ul>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">Why most people underuse it</h2>
<p>Even with clear benefits, warm outreach often gets neglected. Without a framework, it''s easy to feel unorganized, or worse, pushy.</p>
<ul style="margin: 0; padding-left: 18px;">
<li><strong>No system:</strong> hard to know who to reach out to and when</li>
<li><strong>Fear of being "salesy":</strong> holding back instead of providing value</li>
<li><strong>Follow‑through gap:</strong> contacts slip through the cracks without reminders</li>
</ul>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">How PinkWizard helps</h2>
<p>This is where PinkWizard turns warm outreach from an idea into action. Everything you need is built in, so you can prioritize people who already know you without heavy lifting.</p>
<ul style="margin: 0; padding-left: 18px;">
<li>Segment your network by <em>Warm</em> or <em>Hot</em> status, and by relationship (past client, friend, referral source, etc.)</li>
<li>Filter instantly to see who''s ready for your next touch</li>
<li>Use <strong>AI Outreach</strong> to draft context‑aware, friendly messages that match your tone</li>
<li>Set follow‑up cadences and reminders to lock in consistency</li>
<li>Apply <strong>Categories</strong> and bulk updates for fast targeting</li>
<li>Track every interaction on a unified multi‑channel timeline</li>
</ul>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">Best practices</h2>
<p>With PinkWizard giving you the tools, warm outreach becomes easy to scale. A few tips to make it stick:</p>
<ul style="margin: 0; padding-left: 18px;">
<li>🏆 Run a simple weekly "Warm 10" — ten quality touches, every week</li>
<li>🎁 Lead with value before asking for anything</li>
<li>🙌 Keep "micro‑asks" simple and clear</li>
<li>🔄 Rotate channels to mix up your touchpoints</li>
<li>📅 Always set the next touch so momentum continues</li>
<li>🗂 Use Categories thoughtfully to spot gaps and opportunities</li>
</ul>
<!-- Dual CTA Buttons -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
<tbody>
<tr>
<td align="center" bgcolor="#f5518d" style="border-radius: 6px;"><a href="https://www.pink-wizard.com/?tab=contacts&amp;filter=warm" target="_blank" style="display: block; padding: 14px 22px; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; border-radius: 6px; background-color: #f5518d;" rel="noopener noreferrer"> 👥 Open Warm Contacts </a></td>
</tr>
<tr>
<td height="12"> </td>
</tr>
<tr>
<td align="center" bgcolor="#f5518d" style="border-radius: 6px;"><a href="https://www.pink-wizard.com/ai-outreach" target="_blank" style="display: block; padding: 14px 22px; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; border-radius: 6px; background-color: #f5518d;" rel="noopener noreferrer"> ✍️ Generate Warm Outreach </a></td>
</tr>
</tbody>
</table>
<p><strong>P.S.</strong> In <em>Settings → Follow‑Up Settings</em>, enable a monthly cadence for warm contacts and let PinkWizard remind you automatically.</p>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="padding: 20px; text-align: center; font-size: 13px; color: #666;"> </td>
</tr>
</tbody>
</table>
</center>',
  'Hi {{user_name}},

Cold outreach has its place, but it rarely outperforms a simple truth: the people who already know, like, and trust you are far more likely to support you. Warm outreach consistently delivers better results IF you know how to work it. PinkWizard helps you turn this hidden advantage into a repeatable system.

Why warm works:
- Trust advantage: conversations skip the "prove yourself" stage
- Faster cycles: shorter time from hello to yes/no
- Compounding goodwill: each connection strengthens the relationship for next time

Why most people underuse it:
- No system: hard to know who to reach out to and when
- Fear of being "salesy": holding back instead of providing value
- Follow-through gap: contacts slip through the cracks without reminders

How PinkWizard helps:
- Segment your network by Warm or Hot status, and by relationship (past client, friend, referral source, etc.)
- Filter instantly to see who''s ready for your next touch
- Use AI Outreach to draft context-aware, friendly messages that match your tone
- Set follow-up cadences and reminders to lock in consistency
- Apply Categories and bulk updates for fast targeting
- Track every interaction on a unified multi-channel timeline

Best practices:
- Run a simple weekly "Warm 10" — ten quality touches, every week
- Lead with value before asking for anything
- Keep "micro-asks" simple and clear
- Rotate channels to mix up your touchpoints
- Always set the next touch so momentum continues
- Use Categories thoughtfully to spot gaps and opportunities

Open Warm Contacts: https://www.pink-wizard.com/?tab=contacts&filter=warm
Generate Warm Outreach: https://www.pink-wizard.com/ai-outreach

P.S. In Settings → Follow-Up Settings, enable a monthly cadence for warm contacts and let PinkWizard remind you automatically.',
  '{"user_name": "User''s display name or ''there'' as fallback"}'::jsonb,
  'Educational email about the power of warm outreach and how PinkWizard systematizes it better than traditional CRMs',
  true
);