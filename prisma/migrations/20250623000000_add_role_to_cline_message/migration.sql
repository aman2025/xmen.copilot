-- Add role column to ClineMessage table to properly track message origin
ALTER TABLE "ClineMessage" ADD COLUMN "role" TEXT;

-- Update existing records to have appropriate roles based on content patterns
-- This is a best-effort migration for existing data
UPDATE "ClineMessage" 
SET "role" = 'user' 
WHERE "type" = 'say' 
  AND "subType" = 'text' 
  AND (
    "text" LIKE '%--- XML File:%' 
    OR "text" LIKE '%--- JSON File:%' 
    OR "text" LIKE '%--- YAML File:%'
    OR "text" LIKE '%--- File:%'
  );

-- Set remaining messages to assistant role
UPDATE "ClineMessage" 
SET "role" = 'assistant' 
WHERE "role" IS NULL;
