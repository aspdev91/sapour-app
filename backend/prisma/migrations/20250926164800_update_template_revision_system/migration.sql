-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum for TemplateStatus
CREATE TYPE "TemplateStatus" AS ENUM ('draft', 'published', 'archived');

-- Drop existing foreign key constraints on Report table
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_primaryUserId_fkey";
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_secondaryUserId_fkey";

-- Drop existing indexes that will be recreated
DROP INDEX IF EXISTS "Report_reportType_idx";
DROP INDEX IF EXISTS "Report_primaryUserId_createdAt_idx";

-- Rename and restructure Template table
-- First, create a backup of the current Template table
CREATE TABLE "Template_backup" AS SELECT * FROM "Template";

-- Drop the current Template table
DROP TABLE "Template";

-- Create new Template table with the correct structure
CREATE TABLE "Template" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "description" TEXT,
    "status" "TemplateStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- Create TemplateRevision table
CREATE TABLE "TemplateRevision" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changelog" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateRevision_pkey" PRIMARY KEY ("id")
);

-- Restructure Report table
-- Create backup of current Report table
CREATE TABLE "Report_backup" AS SELECT * FROM "Report";

-- Drop current Report table
DROP TABLE "Report";

-- Create new Report table with correct structure
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "primaryUserId" UUID NOT NULL,
    "secondaryUserId" UUID,
    "templateId" UUID NOT NULL,
    "templateRevisionId" UUID NOT NULL,
    "aiProviderName" TEXT NOT NULL,
    "aiModelName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Template
CREATE UNIQUE INDEX "Template_type_key" ON "Template"("type");
CREATE INDEX "Template_type_idx" ON "Template"("type");
CREATE INDEX "Template_status_idx" ON "Template"("status");

-- Create indexes for TemplateRevision
CREATE UNIQUE INDEX "TemplateRevision_templateId_revisionNumber_key" ON "TemplateRevision"("templateId", "revisionNumber");
CREATE INDEX "TemplateRevision_templateId_revisionNumber_idx" ON "TemplateRevision"("templateId", "revisionNumber");
CREATE INDEX "TemplateRevision_templateId_isPublished_idx" ON "TemplateRevision"("templateId", "isPublished");

-- Create indexes for Report
CREATE INDEX "Report_templateId_idx" ON "Report"("templateId");
CREATE INDEX "Report_primaryUserId_createdAt_idx" ON "Report"("primaryUserId", "createdAt" DESC);
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt" DESC);

-- Add foreign key constraints
ALTER TABLE "TemplateRevision" ADD CONSTRAINT "TemplateRevision_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_primaryUserId_fkey" FOREIGN KEY ("primaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_secondaryUserId_fkey" FOREIGN KEY ("secondaryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_templateRevisionId_fkey" FOREIGN KEY ("templateRevisionId") REFERENCES "TemplateRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default templates for each type
INSERT INTO "Template" ("id", "name", "type", "description", "status", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), 'First Impression', 'first_impression', 'Template for first impression analysis', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'First Impression Divergence', 'first_impression_divergence', 'Template for first impression divergence analysis', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'My Type', 'my_type', 'Template for personality type analysis', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'My Type Divergence', 'my_type_divergence', 'Template for personality type divergence analysis', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Romance Compatibility', 'romance_compatibility', 'Template for romance compatibility analysis', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Friendship Compatibility', 'friendship_compatibility', 'Template for friendship compatibility analysis', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert initial revisions for each template
-- Note: In a real migration, you would want to migrate existing template content
-- For now, we'll create placeholder revisions
INSERT INTO "TemplateRevision" ("id", "templateId", "revisionNumber", "content", "changelog", "isPublished", "publishedAt", "createdAt")
SELECT 
    gen_random_uuid(),
    t."id",
    1,
    'Initial template content for ' || t."name" || '. This content should be updated with actual template text.',
    'Initial revision',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Template" t;