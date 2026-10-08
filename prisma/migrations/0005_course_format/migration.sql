-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('VIDEO', 'EBOOK');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "format" "CourseFormat" NOT NULL DEFAULT 'VIDEO';
ALTER TABLE "Lesson" ADD COLUMN "fileUrl" TEXT;
