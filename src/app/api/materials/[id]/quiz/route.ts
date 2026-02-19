import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

// GET - Get quiz for a material
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

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    // Get quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    // For non-mentor users, hide correct answers
    if (decoded.role !== "MENTOR" && decoded.role !== "ADMIN") {
      const sanitizedQuiz = {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          ...q,
          options: q.options.map((o) => ({
            id: o.id,
            label: o.label,
            text: o.text,
            order: o.order,
            // Don't include is_correct for students
          })),
        })),
      };
      return NextResponse.json(sanitizedQuiz);
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Gagal mengambil quiz" }, { status: 500 });
  }
}

// POST - Create quiz for a material (Mentor only)
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
    if (!decoded || (decoded.role !== "MENTOR" && decoded.role !== "ADMIN")) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    // Check if material exists and belongs to mentor
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: {
              include: {
                mentor: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    if (material.type !== "QUIZ") {
      return NextResponse.json({ error: "Tipe materi bukan QUIZ" }, { status: 400 });
    }

    // Verify mentor ownership
    if (decoded.role === "MENTOR" && material.section.course.mentor?.user_id !== decoded.userId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke kursus ini" }, { status: 403 });
    }

    // Check if quiz already exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
    });

    if (existingQuiz) {
      return NextResponse.json({ error: "Quiz sudah ada untuk materi ini" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, passing_score, time_limit, max_attempts, questions } = body;

    // Create quiz with questions and options
    const quiz = await prisma.quiz.create({
      data: {
        material_id: materialId,
        title: title || material.title,
        description: description || "",
        passing_score: passing_score || 70,
        time_limit: time_limit || null,
        max_attempts: max_attempts || 3,
        questions: {
          create: questions?.map((q: { question: string; order: number; points: number; options: { label: string; text: string; is_correct: boolean; order: number }[] }, index: number) => ({
            question: q.question,
            order: q.order || index,
            points: q.points || 1,
            options: {
              create: q.options?.map((o: { label: string; text: string; is_correct: boolean; order: number }, oIndex: number) => ({
                label: o.label || String.fromCharCode(65 + oIndex), // A, B, C, D
                text: o.text,
                is_correct: o.is_correct || false,
                order: o.order || oIndex,
              })),
            },
          })) || [],
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Gagal membuat quiz" }, { status: 500 });
  }
}

// PUT - Update quiz (Mentor only)
export async function PUT(
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
    if (!decoded || (decoded.role !== "MENTOR" && decoded.role !== "ADMIN")) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
      include: {
        material: {
          include: {
            section: {
              include: {
                course: {
                  include: {
                    mentor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    // Verify mentor ownership
    if (decoded.role === "MENTOR" && quiz.material.section.course.mentor?.user_id !== decoded.userId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke quiz ini" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, passing_score, time_limit, max_attempts, questions } = body;

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { material_id: materialId },
      data: {
        title: title || quiz.title,
        description: description ?? quiz.description,
        passing_score: passing_score ?? quiz.passing_score,
        time_limit: time_limit ?? quiz.time_limit,
        max_attempts: max_attempts ?? quiz.max_attempts,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
      // Delete existing questions (cascade will delete options)
      await prisma.quizQuestion.deleteMany({
        where: { quiz_id: quiz.id },
      });

      // Create new questions
      for (const q of questions) {
        await prisma.quizQuestion.create({
          data: {
            quiz_id: quiz.id,
            question: q.question,
            order: q.order || 0,
            points: q.points || 1,
            options: {
              create: q.options?.map((o: { label: string; text: string; is_correct: boolean; order: number }, oIndex: number) => ({
                label: o.label || String.fromCharCode(65 + oIndex),
                text: o.text,
                is_correct: o.is_correct || false,
                order: o.order || oIndex,
              })),
            },
          },
        });
      }
    }

    // Fetch updated quiz with questions
    const finalQuiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(finalQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json({ error: "Gagal mengupdate quiz" }, { status: 500 });
  }
}

// DELETE - Delete quiz (Mentor only)
export async function DELETE(
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
    if (!decoded || (decoded.role !== "MENTOR" && decoded.role !== "ADMIN")) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { material_id: materialId },
      include: {
        material: {
          include: {
            section: {
              include: {
                course: {
                  include: {
                    mentor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    // Verify mentor ownership
    if (decoded.role === "MENTOR" && quiz.material.section.course.mentor?.user_id !== decoded.userId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke quiz ini" }, { status: 403 });
    }

    // Delete quiz (cascade will delete questions and options)
    await prisma.quiz.delete({
      where: { material_id: materialId },
    });

    return NextResponse.json({ message: "Quiz berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json({ error: "Gagal menghapus quiz" }, { status: 500 });
  }
}
