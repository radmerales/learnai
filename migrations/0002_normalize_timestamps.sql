-- The Python backend stored SQLite's default "YYYY-MM-DD HH:MM:SS.ffffff"
-- format. Normalize existing rows to the RFC-3339 shape used by the Rust API.
UPDATE mindmaps
SET created_at = replace(created_at, ' ', 'T') || 'Z'
WHERE created_at NOT LIKE '%Z';

UPDATE mindmaps
SET updated_at = replace(updated_at, ' ', 'T') || 'Z'
WHERE updated_at NOT LIKE '%Z';
