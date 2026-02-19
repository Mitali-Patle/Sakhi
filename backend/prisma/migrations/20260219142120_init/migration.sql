-- CreateEnum
CREATE TYPE "MeetingFrequency" AS ENUM ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('TAMIL', 'HINDI', 'TELUGU', 'ENGLISH');

-- CreateEnum
CREATE TYPE "ScoreConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ScoreBand" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_IMPROVEMENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CONTRIBUTION', 'LOAN_REPAYMENT', 'LOAN_DISBURSEMENT');

-- CreateEnum
CREATE TYPE "LoanPurpose" AS ENUM ('AGRICULTURE', 'BUSINESS', 'EDUCATION', 'MEDICAL', 'HOME_REPAIR', 'FAMILY_FUNCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateTable
CREATE TABLE "SHGGroup" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "meetingFrequency" "MeetingFrequency" NOT NULL,
    "dateFormed" TIMESTAMP(3) NOT NULL,
    "corpusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loanCyclesCompleted" INTEGER NOT NULL DEFAULT 0,
    "leaderPhone" TEXT NOT NULL,
    "leaderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SHGGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'TAMIL',
    "dateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenureMonths" INTEGER NOT NULL DEFAULT 0,
    "loansCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalContributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "repaymentOnTime" BOOLEAN NOT NULL DEFAULT true,
    "outstandingLoanAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "hasDaughterUnder10" BOOLEAN NOT NULL DEFAULT false,
    "creditScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "scoreConfidence" "ScoreConfidence" NOT NULL DEFAULT 'LOW',
    "scoreBand" "ScoreBand" NOT NULL DEFAULT 'FAIR',
    "conversationState" TEXT NOT NULL DEFAULT 'IDLE',
    "conversationContext" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daysLate" INTEGER NOT NULL DEFAULT 0,
    "verifiedByMember" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "purpose" "LoanPurpose" NOT NULL,
    "repaymentMonths" INTEGER NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "LoanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "totalCollected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeEligibility" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "schemeName" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "SchemeEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SHGGroup_leaderPhone_key" ON "SHGGroup"("leaderPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Member_phoneNumber_key" ON "Member"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeEligibility_memberId_schemeName_key" ON "SchemeEligibility"("memberId", "schemeName");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SHGGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRequest" ADD CONSTRAINT "LoanRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SHGGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeEligibility" ADD CONSTRAINT "SchemeEligibility_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
