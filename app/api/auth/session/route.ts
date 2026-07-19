import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { adminRepository } from '@/repositories/admin.repository';
import { Admin } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = await verifyAccessToken(accessToken);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    const admin = await adminRepository.findById(decoded.userId);

    if (!admin) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const adminWithoutPassword = { ...admin } as Partial<Admin>;
    delete adminWithoutPassword.password;

    return NextResponse.json({
      success: true,
      user: adminWithoutPassword as Omit<Admin, 'password'>,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
