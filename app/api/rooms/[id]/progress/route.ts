import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDatabaseUserId } from "@/lib/users";

/** GET: User's answers and score for a room (resume quiz without re-scoring). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const rawUserId = req.nextUrl.searchParams.get("userId");

    if (!rawUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const userId = await resolveDatabaseUserId(rawUserId);
    if (!userId) {
      return NextResponse.json(
        { error: "User account not found. Please sign in again." },
        { status: 400 }
      );
    }

    const [answers, participant] = await Promise.all([
      prisma.answer.findMany({
        where: {
          userId,
          question: { roomId },
        },
        include: {
          question: {
            select: {
              correctOption: true,
              explanation: true,
            },
          },
        },
        orderBy: { answeredAt: "asc" },
      }),
      prisma.roomParticipant.findFirst({
        where: { userId, roomId },
        select: { score: true },
      }),
    ]);

    return NextResponse.json({
      score: participant?.score ?? 0,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
        correctOption: a.question.correctOption,
        explanation: a.question.explanation,
      })),
    });
  } catch (error) {
    console.error("Error fetching room progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch room progress" },
      { status: 500 }
    );
  }
}
