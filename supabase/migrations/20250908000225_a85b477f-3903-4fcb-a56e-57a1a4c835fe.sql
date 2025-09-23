-- Fix security warnings by setting search_path
CREATE OR REPLACE FUNCTION seed_user_categories_and_backfill(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    category_count INTEGER;
BEGIN
    -- Check if user already has categories
    SELECT COUNT(*) INTO category_count
    FROM user_contact_categories
    WHERE user_id = user_id_param;
    
    -- If no categories exist, create defaults
    IF category_count = 0 THEN
        INSERT INTO user_contact_categories (user_id, name, label, icon_name, color_class, is_default)
        VALUES 
            (user_id_param, 'uncategorized', 'Uncategorized', 'HelpCircle', 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100', true),
            (user_id_param, 'corporate_planner', 'Corporate Planner', 'Building2', 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', false),
            (user_id_param, 'wedding_planner', 'Wedding Planner', 'Heart', 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100', false),
            (user_id_param, 'vendor', 'Vendor', 'Package', 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', false),
            (user_id_param, 'venue', 'Venue', 'MapPin', 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', false);
    END IF;
    
    -- Always backfill missing contact categories
    UPDATE contacts 
    SET category = 'uncategorized' 
    WHERE user_id = user_id_param 
    AND (category IS NULL OR category = '' OR category = 'other');
END;
$$;

-- Fix security warnings by setting search_path
CREATE OR REPLACE FUNCTION handle_new_user_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Call the seeding function for the new user
    PERFORM seed_user_categories_and_backfill(NEW.id);
    RETURN NEW;
END;
$$;