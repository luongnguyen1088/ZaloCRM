ALTER TABLE "Claro"."ai_knowledge"
ADD COLUMN IF NOT EXISTS fts_tokens tsvector;

UPDATE "Claro"."ai_knowledge"
SET fts_tokens =
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(content, '')), 'B')
WHERE fts_tokens IS NULL;

CREATE INDEX IF NOT EXISTS ai_knowledge_fts_tokens_idx
ON "Claro"."ai_knowledge"
USING GIN (fts_tokens);
