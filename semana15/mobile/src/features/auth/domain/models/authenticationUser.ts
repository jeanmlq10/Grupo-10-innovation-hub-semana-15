import { parseDate } from "@/src/core/roble/robleRows";

const stringOrNull = (value: unknown): string | null => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
};

/**
 * Mirrors the profile map returned by every Roble sign-in method:
 * `{id, userId, email, name, role, extra, createdAt, updatedAt}`.
 */
export class AuthenticationUser {
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string | null;
  readonly extra: Record<string, unknown>;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  constructor(p: {
    id: string;
    userId: string;
    email: string;
    name: string;
    role?: string | null;
    extra?: Record<string, unknown>;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }) {
    this.id = p.id;
    this.userId = p.userId;
    this.email = p.email;
    this.name = p.name;
    this.role = p.role ?? null;
    this.extra = p.extra ?? {};
    this.createdAt = p.createdAt ?? null;
    this.updatedAt = p.updatedAt ?? null;
  }

  get career(): string | null {
    return stringOrNull(this.extra.career ?? this.extra.programa);
  }

  get photoUrl(): string | null {
    return stringOrNull(this.extra.photo_url ?? this.extra.picture);
  }

  get firstName(): string {
    return this.name.trim().split(/\s+/)[0];
  }

  get lastName(): string {
    const parts = this.name.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  }

  static fromProfile(json: Record<string, unknown>): AuthenticationUser {
    const extra = json.extra;
    const email = (json.email != null ? String(json.email) : "").trim().toLowerCase();
    const name = (json.name != null ? String(json.name) : "").trim();
    return new AuthenticationUser({
      id: json.id != null ? String(json.id) : "",
      userId: json.userId != null ? String(json.userId) : json.id != null ? String(json.id) : "",
      email,
      name: name.length === 0 ? email : name,
      role: stringOrNull(json.role),
      extra: extra && typeof extra === "object" && !Array.isArray(extra) ? { ...(extra as Record<string, unknown>) } : {},
      createdAt: parseDate(json.createdAt != null ? String(json.createdAt) : ""),
      updatedAt: parseDate(json.updatedAt != null ? String(json.updatedAt) : ""),
    });
  }

  toJson() {
    return {
      id: this.id,
      userId: this.userId,
      email: this.email,
      name: this.name,
      role: this.role,
      extra: this.extra,
      createdAt: this.createdAt?.toISOString() ?? null,
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }
}
