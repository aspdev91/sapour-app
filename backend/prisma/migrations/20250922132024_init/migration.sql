-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'audio');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('openai_vision', 'hume');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('first_impression', 'first_impression_divergence', 'my_type', 'my_type_divergence', 'romance_compatibility', 'friendship_compatibility');

-- CreateTable
CREATE TABLE "Admin" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "allowlisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminId" UUID NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "analysisJson" JSONB,
    "provider" "MediaProvider",
    "model" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" UUID NOT NULL,
    "templateType" "TemplateType" NOT NULL,
    "externalDocumentId" TEXT NOT NULL,
    "externalDocumentUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reportType" "TemplateType" NOT NULL,
    "primaryUserId" UUID NOT NULL,
    "secondaryUserId" UUID,
    "templateType" "TemplateType" NOT NULL,
    "templateDocumentId" TEXT NOT NULL,
    "templateRevisionId" TEXT NOT NULL,
    "templateRevisionLabel" TEXT,
    "aiProviderName" TEXT NOT NULL,
    "aiModelName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Media_userId_createdAt_idx" ON "Media"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Template_templateType_key" ON "Template"("templateType");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE INDEX "Report_primaryUserId_createdAt_idx" ON "Report"("primaryUserId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_primaryUserId_fkey" FOREIGN KEY ("primaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_secondaryUserId_fkey" FOREIGN KEY ("secondaryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
