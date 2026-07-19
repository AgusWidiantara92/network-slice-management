import bcrypt from 'bcrypt';
import { adminRepository } from '@/repositories/admin.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';
import { Admin } from '@prisma/client';

export class AuthService {
  private saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(email: string, password: string): Promise<{
    admin: Omit<Admin, 'password'>;
    accessToken: string;
    refreshToken: string;
  } | null> {
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    const adminWithoutPassword = { ...admin } as Partial<Admin>;
    delete adminWithoutPassword.password;

    const accessToken = await signAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const refreshToken = await signRefreshToken({
      userId: admin.id,
    });

    return {
      admin: adminWithoutPassword as Omit<Admin, 'password'>,
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string): Promise<{
    accessToken: string;
    admin: Omit<Admin, 'password'>;
  } | null> {
    const decoded = await verifyRefreshToken(token);
    if (!decoded) {
      return null;
    }

    const admin = await adminRepository.findById(decoded.userId);
    if (!admin) {
      return null;
    }

    const adminWithoutPassword = { ...admin } as Partial<Admin>;
    delete adminWithoutPassword.password;

    const accessToken = await signAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      accessToken,
      admin: adminWithoutPassword as Omit<Admin, 'password'>,
    };
  }
}

export const authService = new AuthService();
