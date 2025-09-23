-- Remove duplicate resource - keep the one that was updated more recently
DELETE FROM educational_resources 
WHERE id = '333347e4-b5a9-46de-b11c-6e17ab076a9d';

-- The resource with id 'd002db8d-0bc9-46ca-abf4-a8ac4f94e156' will remain as it has the more recent updated_at timestamp