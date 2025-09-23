-- Remove challenge participation for sarah@sarahmmurphy.com since they should not be a participant
DELETE FROM user_challenge_progress 
WHERE user_id = (
  SELECT p.id 
  FROM profiles p 
  JOIN auth.users au ON p.id = au.id 
  WHERE au.email = 'sarah@sarahmmurphy.com'
);