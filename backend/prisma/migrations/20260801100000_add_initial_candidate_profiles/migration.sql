-- Establish the initial candidate profiles used by the public application.
-- Existing profiles remain untouched so this migration is safe in production.
INSERT INTO "Candidate" (
  "id", "name", "email", "title", "role", "githubConnected",
  "talentScore", "githubScore", "hackathonScore", "certScore",
  "presentationScore", "openSourceScore", "socialScore", "radarData", "updatedAt"
) VALUES
  ('aditi-rao', 'Aditi Rao', 'aditi@talentiq.ai', 'Full-Stack Engineer', 'candidate', false, 87, 91, 82, 88, 76, 84, 71, '[{"axis":"Tech Depth","value":90},{"axis":"Innovation","value":82},{"axis":"Leadership","value":68},{"axis":"Velocity","value":88},{"axis":"Collab","value":74},{"axis":"Comms","value":70}]', CURRENT_TIMESTAMP),
  ('elena-rodriguez', 'Elena Rodriguez', 'elena@talentiq.ai', 'Senior Backend Engineer', 'candidate', false, 92, 96, 88, 92, 85, 94, 78, '[{"axis":"Tech Depth","value":96},{"axis":"Innovation","value":88},{"axis":"Leadership","value":80},{"axis":"Velocity","value":92},{"axis":"Collab","value":82},{"axis":"Comms","value":78}]', CURRENT_TIMESTAMP),
  ('david-chen', 'David Chen', 'david@talentiq.ai', 'Systems Architect', 'candidate', false, 91, 89, 79, 95, 88, 82, 84, '[{"axis":"Tech Depth","value":94},{"axis":"Innovation","value":76},{"axis":"Leadership","value":90},{"axis":"Velocity","value":80},{"axis":"Collab","value":88},{"axis":"Comms","value":86}]', CURRENT_TIMESTAMP),
  ('sarah-jenkins', 'Sarah Jenkins', 'sarah@talentiq.ai', 'Backend Engineer II', 'candidate', false, 83, 85, 90, 78, 72, 76, 80, '[{"axis":"Tech Depth","value":82},{"axis":"Innovation","value":90},{"axis":"Leadership","value":72},{"axis":"Velocity","value":86},{"axis":"Collab","value":80},{"axis":"Comms","value":70}]', CURRENT_TIMESTAMP),
  ('marcus-okafor', 'Marcus Okafor', 'marcus@talentiq.ai', 'ML Engineer', 'candidate', false, 89, 88, 86, 91, 93, 90, 87, '[{"axis":"Tech Depth","value":88},{"axis":"Innovation","value":94},{"axis":"Leadership","value":82},{"axis":"Velocity","value":84},{"axis":"Collab","value":90},{"axis":"Comms","value":92}]', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
