-- Create email template for Follow-Up Cadence introduction
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
  'introduce_follow_up_cadence_v1',
  'Follow-Up Cadence Feature Introduction',
  'Small tweak, big results: customize your follow-up reminders',
  '<p> </p>
<center style="width: 100%; background: #f9f9f9; padding: 20px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 8px; box-shadow: 0 3px 8px rgba(0,0,0,0.1);"><!-- Header -->
<tbody>
<tr>
<td align="center" style="background: #f5518d; padding: 30px 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
<h1 style="margin: 0; font-size: 24px; color: #ffffff;">🎉 Intro to Feature: Follow‑Up Cadence</h1>
<p style="margin: 8px 0 0; font-size: 15px; color: #ffffff;">Lock in your rhythm, stay consistent, and let the app handle timing.</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding: 25px; font-size: 15px; color: #00343a;">
<p>Hi {{ first_name }},</p>
<p><strong>Quick win for your challenge progress:</strong> we just made <strong>Follow‑Up Cadence</strong> settings available so you can decide how often the app reminds you to reconnect with contacts — automatically.</p>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px;">Why this matters</h2>
<ul style="margin: 0; padding-left: 18px;">
<li>Consistency without the mental load: the next follow‑up date is auto‑set for you</li>
<li>Fewer missed opportunities: warm leads don't go cold in your pipeline</li>
<li>Your rhythm, your rules: different cadences by relationship or status</li>
<li>"Today" option: set 0 days if you want a same‑day follow‑up</li>
</ul>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">How to set it up (2 minutes)</h2>
<ol style="margin: 0; padding-left: 20px;">
<li>Go to <em>Settings → Follow‑Up Cadence</em> (or open the link below)</li>
<li>Toggle <strong>Auto Follow‑Up</strong> ON</li>
<li>Adjust the cadence you want:</li>
<ul style="margin: 6px 0 12px; padding-left: 18px;">
<li>By Relationship (Lead, Lead Amplifier, Past Client, Referral Source, etc.)</li>
<li>By Status (Cold, Warm, Hot, Won, Lost — customize what makes sense)</li>
<li>Optional: set a fallback cadence used when nothing else matches</li>
</ul>
<li>Save — new follow‑ups will automatically get the next date based on your rules</li>
</ol>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">Recommended starting point</h2>
<p style="margin: 0 0 10px;">Easy defaults you can tweak later:</p>
<ul style="margin: 0; padding-left: 18px;">
<li>Leads: every 2 weeks</li>
<li>Lead amplifiers/partners: every 1 week</li>
<li>Warm: every 1 week</li>
<li>Hot: every 1 day (until you get a yes/no)</li>
<li>Cold: every 1 month</li>
<li>Past clients/referrals: every 2–3 months</li>
<li>Won: disabled or light check‑in (e.g., 1–3 months) if you want post‑win touchpoints</li>
</ul>
<p style="margin-top: 8px;"><em>Tip: Need a same‑day nudge? Set Days = 0 for "Today."</em></p>
<h2 style="color: #f5518d; border-bottom: 2px solid #f5518d; padding-bottom: 4px; margin-top: 24px;">What happens next</h2>
<p>Whenever you log an activity or update a contact, we'll automatically set the next follow‑up date for you based on your rules. You can still override any individual contact anytime.</p>
<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
<tbody>
<tr>
<td align="center" bgcolor="#f5518d" style="border-radius: 6px;"><a href="https://pink-wizard.com/settings" target="_blank" style="display: block; padding: 14px 28px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; border-radius: 6px; background-color: #f5518d;" rel="noopener noreferrer"> ⚙️ Open Follow‑Up Settings </a></td>
</tr>
</tbody>
</table>
<p style="margin-top: 10px;">You've got this — steady follow‑ups are the easiest way to rack up points and real results.</p>
<p><strong>P.S.</strong> You can adjust these anytime. Start simple now; refine as you see what works.</p>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="padding: 20px; text-align: center; font-size: 13px; color: #666;">
<p style="margin: 0;"> </p>
</td>
</tr>
</tbody>
</table>
</center>',
  'Hi {{ first_name }},

Quick win for your challenge progress: we just made Follow-Up Cadence settings available so you can decide how often the app reminds you to reconnect with contacts — automatically.

Why this matters:
- Consistency without the mental load: the next follow-up date is auto-set for you
- Fewer missed opportunities: warm leads don't go cold in your pipeline
- Your rhythm, your rules: different cadences by relationship or status
- "Today" option: set 0 days if you want a same-day follow-up

How to set it up (2 minutes):
1. Go to Settings → Follow-Up Cadence
2. Toggle Auto Follow-Up ON
3. Adjust the cadence you want by Relationship and Status
4. Save — new follow-ups will automatically get the next date based on your rules

Recommended starting point:
- Leads: every 2 weeks
- Lead amplifiers/partners: every 1 week  
- Warm: every 1 week
- Hot: every 1 day
- Cold: every 1 month
- Past clients/referrals: every 2–3 months

Visit: https://pink-wizard.com/settings

You've got this — steady follow-ups are the easiest way to rack up points and real results.

P.S. You can adjust these anytime. Start simple now; refine as you see what works.',
  'Promotional email introducing Follow-Up Cadence settings to challenge participants',
  '["first_name"]'::jsonb,
  true,
  (SELECT id FROM auth.users WHERE email = 'hello@mobilebevpros.com' LIMIT 1)
);

-- Update broadcast_challenge_email RPC to include first_name variable
CREATE OR REPLACE FUNCTION public.broadcast_challenge_email(
  template_key_param text,
  subject_override_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_count INTEGER := 0;
  participant_record RECORD;
  first_name_value TEXT;
BEGIN
  -- Only admins can broadcast emails
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to broadcast emails';
  END IF;

  -- Get all active challenge participants with confirmed emails
  FOR participant_record IN
    SELECT 
      p.id as user_id,
      au.email,
      p.display_name,
      ucp.joined_at
    FROM public.user_challenge_progress ucp
    JOIN public.profiles p ON p.id = ucp.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE ucp.is_active = true
      AND au.email_confirmed_at IS NOT NULL
      AND au.email IS NOT NULL
  LOOP
    -- Extract first name from display_name or use email prefix as fallback
    IF participant_record.display_name IS NOT NULL AND participant_record.display_name != '' THEN
      first_name_value := TRIM(SPLIT_PART(participant_record.display_name, ' ', 1));
    ELSE
      first_name_value := TRIM(SPLIT_PART(participant_record.email, '@', 1));
    END IF;
    
    -- Fallback to 'there' if still empty
    IF first_name_value IS NULL OR first_name_value = '' THEN
      first_name_value := 'there';
    END IF;

    -- Insert broadcast email into email_logs for processing
    INSERT INTO public.email_logs (
      template_key,
      recipient_email,
      recipient_user_id,
      subject,
      status,
      metadata,
      created_at
    ) VALUES (
      template_key_param,
      participant_record.email,
      participant_record.user_id,
      COALESCE(subject_override_param, 'Challenge Update'),
      'pending',
      jsonb_build_object(
        'broadcast_type', 'challenge_participants',
        'participant_since', participant_record.joined_at,
        'first_name', first_name_value,
        'user_name', first_name_value,
        'display_name', participant_record.display_name
      ),
      NOW()
    );
    
    email_count := email_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'emails_queued', email_count,
    'message', email_count || ' emails queued for active challenge participants'
  );
END;
$$;