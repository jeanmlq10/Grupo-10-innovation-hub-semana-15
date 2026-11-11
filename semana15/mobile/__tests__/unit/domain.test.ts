// Port 1:1 de las pruebas unitarias de dominio del proyecto Flutter
// (test/unit/**). Mismos casos y mismos valores esperados.
import { RobleAuthConfig } from "@/src/core/roble/robleConfig";
import { RobleRows } from "@/src/core/roble/robleRows";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { isBeforeDeadline } from "@/src/core/utils/deadline";
import { AuthenticationUser } from "@/src/features/auth/domain/models/authenticationUser";
import { PasswordPolicy } from "@/src/features/auth/domain/passwordPolicy";
import { Conversation } from "@/src/features/messages/domain/models/conversation";
import { DirectMessage } from "@/src/features/messages/domain/models/directMessage";
import { AppNotificationType } from "@/src/features/notifications/domain/models/appNotificationType";
import {
  NOTIFICATION_CATEGORY_VALUES,
  NotificationCategories,
  NotificationCategory,
} from "@/src/features/notifications/domain/models/notificationCategory";
import { NotificationPreference, NotificationPreferences } from "@/src/features/notifications/domain/models/notificationPreference";
import { CommitmentLevel, TrajectorySummary } from "@/src/features/profile/domain/models/trajectorySummary";
import {
  CreationDateFilter,
  ExploreFilters,
  MemberAvailabilityFilter,
  ProjectRoleFilter,
  TaskAvailabilityFilter,
} from "@/src/features/projects/domain/models/exploreFilters";
import { Project } from "@/src/features/projects/domain/models/project";
import { ProjectTask, TaskDisplayStatus, TaskProgress } from "@/src/features/tasks/domain/models/projectTask";

describe("PasswordPolicy (mirrors the rule Roble enforces)", () => {
  test("accepts a compliant password", () => {
    for (const p of ["ExamplePass9!", "Abcdef1_", "Abcdef1-", "Abcdef1$", "Abcdef1@", "Abcdef1#"]) {
      expect(PasswordPolicy.validate(p)).toBeNull();
    }
  });
  test("rejects fewer than 8 characters", () => expect(PasswordPolicy.validate("Ab1!xyz")).not.toBeNull());
  test("rejects a missing uppercase letter", () => expect(PasswordPolicy.validate("password1!")).toContain("mayuscula"));
  test("rejects a missing lowercase letter", () => expect(PasswordPolicy.validate("PASSWORD1!")).toContain("minuscula"));
  test("rejects a missing digit", () => expect(PasswordPolicy.validate("Password!!")).toContain("numero"));
  test("rejects a symbol outside the allowed set", () => {
    expect(PasswordPolicy.validate("Password1%")).toContain("simbolo");
    expect(PasswordPolicy.validate("Password1.")).toContain("simbolo");
  });
});

describe("ExploreFilters", () => {
  const project = (p: { createdAt?: Date; teamRoles?: Record<string, number>; accepted?: Record<string, number> } = {}) =>
    new Project({
      id: "p1",
      name: "Proyecto",
      description: "",
      categories: [],
      teamRoles: p.teamRoles ?? {},
      acceptedRoleCounts: p.accepted ?? {},
      createdAt: p.createdAt ?? null,
    } as ConstructorParameters<typeof Project>[0]);
  const now = new Date(2026, 9, 13);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  test("sin filtros, todo coincide", () => {
    expect(ExploreFilters.none.isEmpty).toBe(true);
    expect(ExploreFilters.none.matches(project(), { hasOpenTasks: false, now })).toBe(true);
  });

  test("fecha de creación", () => {
    const recent = project({ createdAt: daysAgo(3) });
    const month = project({ createdAt: daysAgo(20) });
    const old = project({ createdAt: daysAgo(90) });
    const noDate = project();
    const last7 = new ExploreFilters({ creationDate: CreationDateFilter.last7Days });
    const last30 = new ExploreFilters({ creationDate: CreationDateFilter.last30Days });
    const older = new ExploreFilters({ creationDate: CreationDateFilter.older });
    const m = (f: ExploreFilters, p: Project) => f.matches(p, { hasOpenTasks: false, now });
    expect(m(last7, recent)).toBe(true);
    expect(m(last7, month)).toBe(false);
    expect(m(last30, month)).toBe(true);
    expect(m(last30, old)).toBe(false);
    expect(m(older, old)).toBe(true);
    expect(m(older, noDate)).toBe(true);
    expect(m(older, recent)).toBe(false);
  });

  test("disponibilidad de tareas", () => {
    const withTasks = new ExploreFilters({ taskAvailability: TaskAvailabilityFilter.withOpenTasks });
    const withoutTasks = new ExploreFilters({ taskAvailability: TaskAvailabilityFilter.withoutOpenTasks });
    expect(withTasks.matches(project(), { hasOpenTasks: true, now })).toBe(true);
    expect(withTasks.matches(project(), { hasOpenTasks: false, now })).toBe(false);
    expect(withoutTasks.matches(project(), { hasOpenTasks: false, now })).toBe(true);
  });

  test("rol y disponibilidad de miembros se combinan", () => {
    const p = project({ teamRoles: { "Diseñador/a": 1, "Desarrollador/a": 2 }, accepted: { "Diseñador/a": 1 } });
    const designer = new ExploreFilters().toggleRole(ProjectRoleFilter.designer);
    expect(designer.matches(p, { hasOpenTasks: false, now })).toBe(true);
    expect(
      designer.copyWith({ memberAvailability: MemberAvailabilityFilter.withOpenSpots }).matches(p, { hasOpenTasks: false, now }),
    ).toBe(false);
    expect(
      new ExploreFilters({ memberAvailability: MemberAvailabilityFilter.withOpenSpots })
        .toggleRole(ProjectRoleFilter.developer)
        .matches(p, { hasOpenTasks: false, now }),
    ).toBe(true);
    expect(new ExploreFilters().toggleRole(ProjectRoleFilter.leader).matches(p, { hasOpenTasks: false, now })).toBe(false);
  });

  test('"Otros" agrupa roles que no son los cuatro fijos', () => {
    const p = project({ teamRoles: { "Investigador/a": 1 } });
    const others = new ExploreFilters().toggleRole(ProjectRoleFilter.other);
    expect(others.matches(p, { hasOpenTasks: false, now })).toBe(true);
    expect(others.activeCount).toBe(1);
  });
});

describe("deadlines", () => {
  const deadline = new Date(2026, 9, 25);

  test("la fecha límite incluye todo ese día", () => {
    expect(isBeforeDeadline(deadline, new Date(2026, 9, 25, 23, 59))).toBe(true);
    expect(isBeforeDeadline(deadline, new Date(2026, 9, 26))).toBe(false);
    expect(isBeforeDeadline(null, new Date(2030, 0, 1))).toBe(true);
  });

  test("estado y postulación de una tarea", () => {
    const task = new ProjectTask({ id: "t1", projectId: "p1", title: "Diseñar interfaz", deadline });
    const before = new Date(2026, 9, 20);
    const after = new Date(2026, 9, 27);
    expect(task.canApplyAt(before)).toBe(true);
    expect(task.displayStatusAt(before)).toBe(TaskDisplayStatus.available);
    expect(task.canApplyAt(after)).toBe(false);
    expect(task.displayStatusAt(after)).toBe(TaskDisplayStatus.closed);
    const full = task.copyWith({ numberAccepted: 1 });
    expect(full.displayStatusAt(before)).toBe(TaskDisplayStatus.inProgress);
    expect(full.canApplyAt(before)).toBe(false);
    const done = task.copyWith({ progress: TaskProgress.completed });
    expect(done.displayStatusAt(before)).toBe(TaskDisplayStatus.completed);
    expect(done.canApplyAt(before)).toBe(false);
  });

  test("convocatoria del equipo", () => {
    const p = new Project({
      id: "p1",
      name: "Plataforma de tutorías",
      description: "",
      categories: [],
      teamDeadline: deadline,
    } as ConstructorParameters<typeof Project>[0]);
    expect(p.isTeamCallOpenAt(new Date(2026, 9, 25, 12))).toBe(true);
    expect(p.isTeamCallOpenAt(new Date(2026, 9, 26, 0, 1))).toBe(false);
  });

  test("fechas sin hora en Roble y formato corto", () => {
    expect(RobleRows.dayIso(new Date(2026, 9, 5))).toBe("2026-10-05");
    expect(RobleRows.day("2026-10-05")).toEqual(new Date(2026, 9, 5));
    expect(RobleRows.day("2026-10-05T00:00:00.000Z")).toEqual(new Date(2026, 9, 5));
    expect(RobleRows.day(null)).toBeNull();
    expect(formatShortDate(new Date(2026, 9, 25))).toBe("25 oct 2026");
  });
});

describe("TrajectorySummary", () => {
  test('sin actividad es "Nuevo"', () => {
    expect(TrajectorySummary.empty.commitment).toBe(CommitmentLevel.newcomer);
    expect(TrajectorySummary.empty.fulfillment).toBe(0);
  });
  test("calcula desempeño y compromiso", () => {
    const s = new TrajectorySummary({
      projectsCreated: 1,
      projectsCompleted: 1,
      tasksAssigned: 4,
      tasksCompleted: 3,
      participations: 2,
      comments: 2,
      requestsSent: 2,
      requestsAccepted: 2,
    });
    expect(s.collaboration).toBe(0.8);
    expect(s.fulfillment).toBe(0.75);
    expect(s.quality).toBe(1);
    expect(s.commitment).toBe(CommitmentLevel.high);
  });
});

describe("NotificationCategory", () => {
  test("cada tipo cae en su categoría de filtro", () => {
    expect(NotificationCategories.ofType(AppNotificationType.newRequest)).toBe(NotificationCategory.participationRequests);
    expect(NotificationCategories.ofType(AppNotificationType.taskApplicationRejected)).toBe(NotificationCategory.taskApplications);
    expect(NotificationCategories.ofType(AppNotificationType.taskCompleted)).toBe(NotificationCategory.completedTasks);
    expect(NotificationCategories.ofType(AppNotificationType.newComment)).toBe(NotificationCategory.comments);
  });
  test("preferencias apagadas ocultan sus categorías", () => {
    const muted = NotificationPreferences.mutedCategories({
      allEnabled: true,
      mutedKeys: new Set([NotificationPreferences.key(NotificationPreference.comments)]),
    });
    expect(muted).toEqual(new Set([NotificationCategory.comments]));
    expect(NotificationPreferences.mutedCategories({ allEnabled: false, mutedKeys: new Set() })).toEqual(
      new Set(NOTIFICATION_CATEGORY_VALUES),
    );
  });
});

describe("Conversation", () => {
  const m = (from: string, to: string, minute: number, read = false) =>
    new DirectMessage({
      id: `${from}${to}${minute}`,
      fromUserId: from,
      fromName: from.toUpperCase(),
      toUserId: to,
      toName: to.toUpperCase(),
      text: `hola ${minute}`,
      createdAt: new Date(2026, 9, 14, 10, minute),
      read,
    });
  test("agrupa por la otra persona y cuenta no leídos", () => {
    const list = Conversation.group("me", [m("ana", "me", 1), m("me", "ana", 2), m("ana", "me", 3), m("juan", "me", 0, true)]);
    expect(list.map((c) => c.otherUserId)).toEqual(["ana", "juan"]);
    expect(list[0].otherName).toBe("ANA");
    expect(list[0].unreadCount).toBe(2);
    expect(list[list.length - 1].unreadCount).toBe(0);
  });
});

describe("RobleAuthConfig", () => {
  const config = ({ contractId = "movil_flutter_dcaabc5f4e", domain = "uninorte.edu.co" } = {}) =>
    new RobleAuthConfig("https://roble-api.test-openlab.uninorte.edu.co", contractId, "innovation-hub-web-dev", "", domain);
  test("isConfigured is false without a contract id", () => {
    expect(config().isConfigured).toBe(true);
    expect(config({ contractId: "" }).isConfigured).toBe(false);
  });
  test("accepts an institutional email regardless of case", () =>
    expect(config().isInstitutionalEmail("Ana@Uninorte.Edu.Co")).toBe(true));
  test("rejects a non-institutional email", () => expect(config().isInstitutionalEmail("ana@gmail.com")).toBe(false));
  test("accepts any domain when institutionalEmailDomain is empty", () =>
    expect(config({ domain: "" }).isInstitutionalEmail("ana@gmail.com")).toBe(true));
});

describe("AuthenticationUser.fromProfile", () => {
  test("maps every field of the profile Roble returns from login/currentUser", () => {
    const user = AuthenticationUser.fromProfile({
      id: "us-3f2a",
      userId: "9c1e",
      email: "ana@uninorte.edu.co",
      name: "Ana Garcia",
      role: "admin",
      extra: { career: "Sistemas", photo_url: "https://example.com/a.png" },
      createdAt: "2026-08-27T12:00:00.000Z",
      updatedAt: null,
    });
    expect(user.id).toBe("us-3f2a");
    expect(user.userId).toBe("9c1e");
    expect(user.email).toBe("ana@uninorte.edu.co");
    expect(user.name).toBe("Ana Garcia");
    expect(user.role).toBe("admin");
    expect(user.career).toBe("Sistemas");
    expect(user.photoUrl).toBe("https://example.com/a.png");
    expect(user.createdAt).toEqual(new Date("2026-08-27T12:00:00.000Z"));
    expect(user.updatedAt).toBeNull();
  });
  test("role is null, not a crash, when Roble has not assigned one", () => {
    const user = AuthenticationUser.fromProfile({ id: "us-1", userId: "u-1", email: "ana@uninorte.edu.co", name: "Ana", role: null, extra: {} });
    expect(user.role).toBeNull();
    expect(user.career).toBeNull();
    expect(user.photoUrl).toBeNull();
  });
  test("falls back userId to id when Roble omits it", () => {
    expect(AuthenticationUser.fromProfile({ id: "us-1", email: "ana@uninorte.edu.co", name: "Ana" }).userId).toBe("us-1");
  });
});
