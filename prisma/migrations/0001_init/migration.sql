-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FREELANCER', 'CONTRACTOR', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE "TravelPreference" AS ENUM ('CHOSEN_CITIES', 'KM_20', 'KM_50', 'ANY');
CREATE TYPE "ExperienceLevel" AS ENUM ('NONE', 'INFORMAL', 'PROFESSIONAL');
CREATE TYPE "AvailabilityKind" AS ENUM ('AVAILABLE', 'UNAVAILABLE');
CREATE TYPE "ContractorKind" AS ENUM ('COMPANY', 'PERSON');
CREATE TYPE "OpportunityType" AS ENUM ('SINGLE', 'RECURRING', 'TEMPORARY', 'FIXED');
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED', 'CANCELLED');
CREATE TYPE "PayUnit" AS ENUM ('SHIFT', 'HOUR', 'MONTH', 'TOTAL');
CREATE TYPE "ApplicationStatus" AS ENUM ('SENT', 'VIEWED', 'IN_REVIEW', 'SELECTED', 'REJECTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReviewDirection" AS ENUM ('CONTRACTOR_TO_FREELANCER', 'FREELANCER_TO_CONTRACTOR');
CREATE TYPE "NotificationType" AS ENUM ('NEW_OPPORTUNITY', 'URGENT_OPPORTUNITY', 'NEW_APPLICATION', 'APPLICATION_VIEWED', 'APPLICATION_IN_REVIEW', 'APPLICATION_SELECTED', 'APPLICATION_REJECTED', 'APPLICATION_CANCELLED', 'CONTRACT_CANCELLED', 'WORK_MARKED_DONE', 'WORK_CONFIRMED', 'NEW_REVIEW', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "slug" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "regionId" TEXT,
    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FreelancerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "mainCityId" TEXT,
    "travelPreference" "TravelPreference" NOT NULL DEFAULT 'CHOSEN_CITIES',
    "experienceLevel" "ExperienceLevel",
    "experienceYears" INTEGER,
    "experienceDescription" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateMinCents" INTEGER,
    "rateMaxCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FreelancerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FreelancerCity" (
    "freelancerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    CONSTRAINT "FreelancerCity_pkey" PRIMARY KEY ("freelancerId","cityId")
);

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emoji" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FreelancerRole" (
    "freelancerId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "FreelancerRole_pkey" PRIMARY KEY ("freelancerId","roleId")
);

CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "kind" "AvailabilityKind" NOT NULL DEFAULT 'AVAILABLE',
    "weekday" INTEGER,
    "date" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContractorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ContractorKind" NOT NULL DEFAULT 'COMPANY',
    "displayName" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "description" TEXT,
    "cityId" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "instagram" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContractorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleId" TEXT,
    "slots" INTEGER NOT NULL,
    "cityId" TEXT NOT NULL,
    "address" TEXT,
    "type" "OpportunityType" NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "recurrenceDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startTime" TEXT,
    "endTime" TEXT,
    "payCents" INTEGER,
    "payUnit" "PayUnit" NOT NULL DEFAULT 'SHIFT',
    "paymentMethod" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SENT',
    "message" TEXT,
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "agreedPayCents" INTEGER,
    "agreedPayUnit" "PayUnit" NOT NULL DEFAULT 'SHIFT',
    "workDate" DATE,
    "startTime" TEXT,
    "endTime" TEXT,
    "contractorMarkedAt" TIMESTAMP(3),
    "freelancerConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" "UserRole",
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "direction" "ReviewDirection" NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "criteria" JSONB NOT NULL,
    "comment" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "emoji" TEXT,
    "roleId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");
CREATE INDEX "City_active_idx" ON "City"("active");
CREATE UNIQUE INDEX "City_name_state_key" ON "City"("name", "state");
CREATE UNIQUE INDEX "FreelancerProfile_userId_key" ON "FreelancerProfile"("userId");
CREATE INDEX "FreelancerProfile_mainCityId_idx" ON "FreelancerProfile"("mainCityId");
CREATE INDEX "FreelancerCity_cityId_idx" ON "FreelancerCity"("cityId");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");
CREATE INDEX "FreelancerRole_roleId_idx" ON "FreelancerRole"("roleId");
CREATE INDEX "Availability_freelancerId_idx" ON "Availability"("freelancerId");
CREATE UNIQUE INDEX "ContractorProfile_userId_key" ON "ContractorProfile"("userId");
CREATE INDEX "Opportunity_status_cityId_idx" ON "Opportunity"("status", "cityId");
CREATE INDEX "Opportunity_contractorId_status_idx" ON "Opportunity"("contractorId", "status");
CREATE INDEX "Opportunity_startDate_idx" ON "Opportunity"("startDate");
CREATE INDEX "Application_freelancerId_status_idx" ON "Application"("freelancerId", "status");
CREATE UNIQUE INDEX "Application_opportunityId_freelancerId_key" ON "Application"("opportunityId", "freelancerId");
CREATE UNIQUE INDEX "Contract_applicationId_key" ON "Contract"("applicationId");
CREATE INDEX "Contract_freelancerId_status_idx" ON "Contract"("freelancerId", "status");
CREATE INDEX "Contract_contractorId_status_idx" ON "Contract"("contractorId", "status");
CREATE INDEX "Review_targetId_hidden_idx" ON "Review"("targetId", "hidden");
CREATE UNIQUE INDEX "Review_contractId_direction_key" ON "Review"("contractId", "direction");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FreelancerProfile" ADD CONSTRAINT "FreelancerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreelancerProfile" ADD CONSTRAINT "FreelancerProfile_mainCityId_fkey" FOREIGN KEY ("mainCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FreelancerCity" ADD CONSTRAINT "FreelancerCity_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreelancerCity" ADD CONSTRAINT "FreelancerCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreelancerRole" ADD CONSTRAINT "FreelancerRole_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreelancerRole" ADD CONSTRAINT "FreelancerRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractorProfile" ADD CONSTRAINT "ContractorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractorProfile" ADD CONSTRAINT "ContractorProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "ContractorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "ContractorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
