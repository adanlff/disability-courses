import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateTokens, generateRandomToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';
import { sendVerificationEmail } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, full_name, disability_type } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        full_name,
        // If STUDENT or MENTOR is selected, set disability_type to null (not a disability)
        disability_type: (disability_type === 'MENTOR' || disability_type === 'STUDENT') ? null : disability_type,
        role: disability_type === 'MENTOR' ? UserRole.MENTOR : UserRole.STUDENT,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        disability_type: true,
        created_at: true,
      },
    });

    // Create verification token
    const verificationToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        user_id: user.id,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expires_at: expiresAt,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.full_name, verificationToken);
      console.log(`✅ Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail registration if email fails, just log it
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Note: MentorProfile is NOT created here.
    // Mentor must complete profile and apply via /api/mentors/apply to create their profile.

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'REGISTER',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user,
        ...tokens,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
