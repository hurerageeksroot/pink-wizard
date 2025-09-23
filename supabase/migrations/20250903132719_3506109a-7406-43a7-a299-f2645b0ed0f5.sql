-- Add admin role for hello@mobilebevpros.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('8911c9ef-4c9f-43da-9162-b11087f25bfd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;