-- Remove duplicate records from user_program_tasks before adding unique constraint
WITH duplicate_tasks AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, program_task_definition_id 
           ORDER BY created_at DESC
         ) as rn
  FROM public.user_program_tasks
)
DELETE FROM public.user_program_tasks 
WHERE id IN (
  SELECT id FROM duplicate_tasks WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.user_program_tasks 
ADD CONSTRAINT user_program_tasks_user_task_unique 
UNIQUE (user_id, program_task_definition_id);