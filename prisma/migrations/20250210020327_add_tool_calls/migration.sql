/*
  Warnings:

  - Added the required column `title` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "toolCallId" TEXT,
ADD COLUMN     "toolCalls" JSONB;
