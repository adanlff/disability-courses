import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

// POST - Submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    // Get quiz
    const quiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        material: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    // Check user enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        user_id: decoded.userId,
        course_id: quiz.material.section.course.id,
        status: "ACTIVE",
      },
    });

    if (!enrollment && decoded.role === "STUDENT") {
      return NextResponse.json({ error: "Anda tidak terdaftar di kursus ini" }, { status: 403 });
    }

    // Check max attempts
    const existingAttempts = await prisma.quizAttempt.count({
      where: {
        quiz_id: quiz.id,
        user_id: decoded.userId,
        completed_at: { not: null },
      },
    });

    if (existingAttempts >= quiz.max_attempts) {
      return NextResponse.json({ 
        error: `Anda sudah mencapai batas maksimal ${quiz.max_attempts} percobaan` 
      }, { status: 400 });
    }

    const body = await request.json();
    const { answers } = body; // Array of { question_id, selected }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Format jawaban tidak valid" }, { status: 400 });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const processedAnswers: { question_id: string; selected: string; is_correct: boolean }[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find((a: { question_id: string }) => a.question_id === question.id);
      
      if (userAnswer) {
        const correctOption = question.options.find((o) => o.is_correct);
        const isCorrect = correctOption?.label === userAnswer.selected;
        
        if (isCorrect) {
          earnedPoints += question.points;
        }

        processedAnswers.push({
          question_id: question.id,
          selected: userAnswer.selected,
          is_correct: isCorrect,
        });
      } else {
        processedAnswers.push({
          question_id: question.id,
          selected: "",
          is_correct: false,
        });
      }
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = score >= quiz.passing_score;

    // Create attempt with answers
    const attempt = await prisma.quizAttempt.create({
      data: {
        quiz_id: quiz.id,
        user_id: decoded.userId,
        score,
        is_passed: isPassed,
        completed_at: new Date(),
        answers: {
          create: processedAnswers,
        },
      },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    // If passed, mark material as completed and update enrollment progress
    if (isPassed && enrollment) {
      await prisma.progress.upsert({
        where: {
          enrollment_id_material_id: {
            enrollment_id: enrollment.id,
            material_id: materialId,
          },
        },
        update: {
          is_completed: true,
          completed_at: new Date(),
        },
        create: {
          enrollment_id: enrollment.id,
          material_id: materialId,
          user_id: decoded.userId,
          is_completed: true,
          completed_at: new Date(),
        },
      });

      // Update enrollment progress percentage
      const allMaterials = await prisma.material.findMany({
        where: {
          section: {
            course_id: quiz.material.section.course.id,
          },
        },
        select: { id: true },
      });

      const completedProgress = await prisma.progress.count({
        where: {
          enrollment_id: enrollment.id,
          is_completed: true,
        },
      });

      const overallProgress = allMaterials.length > 0 
        ? Math.round((completedProgress / allMaterials.length) * 100)
        : 0;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: overallProgress,
          last_accessed_at: new Date(),
          status: overallProgress === 100 ? 'COMPLETED' : 'ACTIVE',
          completed_at: overallProgress === 100 ? new Date() : undefined,
        },
      });

      // Auto-generate certificate when course is 100% completed
      if (overallProgress === 100) {
        const existingCertificate = await prisma.certificate.findFirst({
          where: {
            user_id: decoded.userId,
            course_id: quiz.material.section.course.id,
          },
        });

        if (!existingCertificate) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          const certificateNumber = `CERT-${timestamp}-${random}`;

          const certificate = await prisma.certificate.create({
            data: {
              user_id: decoded.userId,
              course_id: quiz.material.section.course.id,
              certificate_number: certificateNumber,
              status: 'ISSUED',
              issued_at: new Date(),
            },
          });

          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { certificate_id: certificate.id },
          });
        }
      }
    }

    return NextResponse.json({
      attempt_id: attempt.id,
      score: Math.round(score),
      is_passed: isPassed,
      passing_score: quiz.passing_score,
      total_questions: quiz.questions.length,
      correct_answers: processedAnswers.filter((a) => a.is_correct).length,
      attempts_remaining: quiz.max_attempts - existingAttempts - 1,
      answers: attempt.answers.map((a) => ({
        question_id: a.question_id,
        question: a.question.question,
        selected: a.selected,
        is_correct: a.is_correct,
        correct_answer: a.question.options.find((o) => o.is_correct)?.label,
      })),
    });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    return NextResponse.json({ error: "Gagal mengirim jawaban" }, { status: 500 });
  }
}

// GET - Get user's quiz attempts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    // Get quiz
    const quiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    // Get user's attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quiz_id: quiz.id,
        user_id: decoded.userId,
      },
      orderBy: { started_at: "desc" },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    return NextResponse.json({
      quiz_id: quiz.id,
      max_attempts: quiz.max_attempts,
      passing_score: quiz.passing_score,
      attempts_count: attempts.filter((a) => a.completed_at).length,
      attempts_remaining: quiz.max_attempts - attempts.filter((a) => a.completed_at).length,
      best_score: attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0,
      is_passed: attempts.some((a) => a.is_passed),
      attempts: attempts.map((a) => ({
        id: a.id,
        score: Math.round(a.score),
        is_passed: a.is_passed,
        started_at: a.started_at,
        completed_at: a.completed_at,
        correct_count: a.answers.filter((ans) => ans.is_correct).length,
        total_questions: a.answers.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json({ error: "Gagal mengambil data percobaan" }, { status: 500 });
  }
}
