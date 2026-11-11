/** Visibilidad del perfil ("Privacidad → Visibilidad del perfil"). */
export enum ProfileVisibility {
  public = "public",
  private = "private",
}

/** "Privacidad → Quién puede contactarte". */
export enum ContactPermission {
  everyone = "everyone",
  nobody = "nobody",
}

/** "Privacidad → Datos de actividad". */
export enum ActivityVisibility {
  onlyMe = "onlyMe",
  everyone = "everyone",
}

/** El perfil de un usuario (tabla `user_profiles`, una fila por usuario). */
export class UserProfile {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly username: string;
  readonly bio: string;
  readonly career: string;
  readonly visibility: ProfileVisibility;
  readonly contact: ContactPermission;
  readonly activityVisibility: ActivityVisibility;
  readonly notificationsEnabled: boolean;
  readonly mutedNotifications: ReadonlySet<string>;
  readonly avatarIcon: string;

  constructor(p: {
    userId: string;
    name: string;
    id?: string;
    email?: string;
    username?: string;
    bio?: string;
    career?: string;
    visibility?: ProfileVisibility;
    contact?: ContactPermission;
    activityVisibility?: ActivityVisibility;
    notificationsEnabled?: boolean;
    mutedNotifications?: ReadonlySet<string>;
    avatarIcon?: string;
  }) {
    this.id = p.id ?? "";
    this.userId = p.userId;
    this.name = p.name;
    this.email = p.email ?? "";
    this.username = p.username ?? "";
    this.bio = p.bio ?? "";
    this.career = p.career ?? "";
    this.visibility = p.visibility ?? ProfileVisibility.public;
    this.contact = p.contact ?? ContactPermission.everyone;
    this.activityVisibility = p.activityVisibility ?? ActivityVisibility.everyone;
    this.notificationsEnabled = p.notificationsEnabled ?? true;
    this.mutedNotifications = p.mutedNotifications ?? new Set();
    this.avatarIcon = p.avatarIcon ?? "";
  }

  static fromSession({
    userId,
    name,
    email = "",
    career = "",
  }: {
    userId: string;
    name: string;
    email?: string;
    career?: string;
  }): UserProfile {
    return new UserProfile({
      userId,
      name,
      email,
      career,
      username: email.includes("@") ? email.split("@")[0] : "",
    });
  }

  get isPublic() {
    return this.visibility === ProfileVisibility.public;
  }
  get acceptsMessages() {
    return this.contact === ContactPermission.everyone;
  }
  get showsActivity() {
    return this.activityVisibility === ActivityVisibility.everyone;
  }

  copyWith(c: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    username?: string | null;
    bio?: string | null;
    career?: string | null;
    visibility?: ProfileVisibility | null;
    contact?: ContactPermission | null;
    activityVisibility?: ActivityVisibility | null;
    notificationsEnabled?: boolean | null;
    mutedNotifications?: ReadonlySet<string> | null;
    avatarIcon?: string | null;
  }): UserProfile {
    return new UserProfile({
      id: c.id ?? this.id,
      userId: this.userId,
      name: c.name ?? this.name,
      email: c.email ?? this.email,
      username: c.username ?? this.username,
      bio: c.bio ?? this.bio,
      career: c.career ?? this.career,
      visibility: c.visibility ?? this.visibility,
      contact: c.contact ?? this.contact,
      activityVisibility: c.activityVisibility ?? this.activityVisibility,
      notificationsEnabled: c.notificationsEnabled ?? this.notificationsEnabled,
      mutedNotifications: c.mutedNotifications ?? this.mutedNotifications,
      avatarIcon: c.avatarIcon ?? this.avatarIcon,
    });
  }
}
