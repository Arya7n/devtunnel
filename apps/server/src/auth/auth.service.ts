import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, name },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user.id, stored.user.email);
    return { user: this.toAuthUser(stored.user), ...tokens };
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      const user = await this.getUserById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /** Accept either a JWT access token or a `dt_...` API key. */
  async validateCredential(token: string): Promise<AuthUser> {
    if (token.startsWith('dt_')) {
      return this.validateApiKey(token);
    }
    return this.verifyAccessToken(token);
  }

  async createApiKey(userId: string, label = 'default') {
    const rawKey = `dt_${randomBytes(24).toString('base64url')}`;
    const keyHash = this.hashToken(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    const record = await this.prisma.apiKey.create({
      data: { userId, label, keyPrefix, keyHash },
    });

    return {
      id: record.id,
      label: record.label,
      keyPrefix: record.keyPrefix,
      createdAt: record.createdAt.toISOString(),
      key: rawKey,
    };
  }

  async listApiKeys(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key) => ({
      id: key.id,
      label: key.label,
      keyPrefix: key.keyPrefix,
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    }));
  }

  async revokeApiKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId, revokedAt: null },
    });
    if (!key) {
      throw new UnauthorizedException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });

    return { revoked: true };
  }

  async validateApiKey(rawKey: string): Promise<AuthUser> {
    const keyHash = this.hashToken(rawKey);
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!key || key.revokedAt) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return this.toAuthUser(key.user);
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: Math.floor(this.parseDurationMs(accessTtl) / 1000),
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '7d';
    const expiresAt = new Date(Date.now() + this.parseDurationMs(refreshTtl));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private toAuthUser(user: { id: string; email: string; name: string | null }): AuthUser {
    return { id: user.id, email: user.email, name: user.name };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationMs(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(match[1]);
    const unit = match[2];
    const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return amount * mult;
  }
}
