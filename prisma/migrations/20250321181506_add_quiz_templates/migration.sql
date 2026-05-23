-- CreateTable
CREATE TABLE "QuizTemplate" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizTemplateQuestion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOption" INTEGER NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizTemplateQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizTemplateQuestion_templateId_idx" ON "QuizTemplateQuestion"("templateId");

-- AddForeignKey
ALTER TABLE "QuizTemplateQuestion" ADD CONSTRAINT "QuizTemplateQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuizTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
