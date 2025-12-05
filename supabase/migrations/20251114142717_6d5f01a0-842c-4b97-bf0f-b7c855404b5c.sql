-- Step 1: Allow NULL emails first (before cleaning up invalid emails)
ALTER TABLE contacts ALTER COLUMN email DROP NOT NULL;

-- Step 2: Clean up invalid emails (typos, missing TLDs, trailing dots)
UPDATE contacts 
SET email = NULL 
WHERE email IS NOT NULL 
  AND email != ''
  AND email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- Step 3: Clean up existing empty string emails to NULL for consistency
UPDATE contacts SET email = NULL WHERE email = '';

-- Step 4: Add check constraint to ensure email is either NULL or valid format
ALTER TABLE contacts ADD CONSTRAINT email_format_check 
  CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Step 5: Add comment for documentation
COMMENT ON COLUMN contacts.email IS 'Email address (nullable for Instagram imports without contact info). Will be enriched via research-contact function.';