-- Create user_relationship_types table
CREATE TABLE public.user_relationship_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Users',
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
  is_lead_type BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on user_relationship_types
ALTER TABLE public.user_relationship_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_relationship_types
CREATE POLICY "Users can view their own relationship types"
ON public.user_relationship_types
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relationship types"
ON public.user_relationship_types
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationship types"
ON public.user_relationship_types
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationship types"
ON public.user_relationship_types
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to seed default relationship types for new users
CREATE OR REPLACE FUNCTION public.seed_default_relationship_types(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default relationship types
  INSERT INTO public.user_relationship_types (user_id, name, label, icon_name, color_class, is_lead_type, is_default, sort_order) VALUES
  (p_user_id, 'lead', 'Lead - Client', 'Target', 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800', true, true, 1),
  (p_user_id, 'lead_amplifier', 'Lead - Amplifier', 'Target', 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800', true, true, 2),
  (p_user_id, 'past_client', 'Past Client', 'UserCheck', 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', false, true, 3),
  (p_user_id, 'friend_family', 'Friend/Family', 'Heart', 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800', false, true, 4),
  (p_user_id, 'associate_partner', 'Colleague/Associate', 'Handshake', 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', false, true, 5),
  (p_user_id, 'referral_source', 'Referral Source', 'Share2', 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', false, true, 6),
  (p_user_id, 'booked_client', 'Current Client', 'UserCheck', 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', false, true, 7)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_relationship_types_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_relationship_types_updated_at
  BEFORE UPDATE ON public.user_relationship_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_relationship_types_updated_at();