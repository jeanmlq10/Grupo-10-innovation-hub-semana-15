// Pruebas de las correcciones de noviembre 2026 (registro, tareas "Solo
// equipo", eliminación lógica, comentarios con respuestas, notificaciones,
// documentos de contexto y perfil). Usan datasources falsos en memoria: no
// hay red ni Roble real.
import { RobleOptionalColumns } from "@/src/core/roble/robleOptionalColumns";
import { RobleApiHttpException } from "@/src/core/roble/sdk/robleExceptions";
import { Row } from "@/src/core/roble/sdk/robleOwnership";
import { formatDateTime } from "@/src/core/utils/dateFormat";
import { PasswordPolicy } from "@/src/features/auth/domain/passwordPolicy";
import { ICommentDataSource } from "@/src/features/comments/data/datasources/iCommentDataSource";
import { CommentRepository } from "@/src/features/comments/data/repositories/commentRepository";
import { CommentThread, ProjectComment } from "@/src/features/comments/domain/models/projectComment";
import { AppNotification } from "@/src/features/notifications/domain/models/appNotification";
import { AppNotificationType } from "@/src/features/notifications/domain/models/appNotificationType";
import { NotificationCategories, NotificationCategory } from "@/src/features/notifications/domain/models/notificationCategory";
import {
  dedupeNotifications,
  NotificationsController,
  QUICK_FILTERS,
  QuickFilter,
} from "@/src/features/notifications/ui/viewmodels/notificationsController";
import { TrajectorySummary } from "@/src/features/profile/domain/models/trajectorySummary";
import { IProjectDataSource } from "@/src/features/projects/data/datasources/iProjectDataSource";
import { ProjectRepository } from "@/src/features/projects/data/repositories/projectRepository";
import { AttachmentPolicy, ProjectAttachment } from "@/src/features/projects/domain/models/projectAttachment";
import { ITaskDataSource } from "@/src/features/tasks/data/datasources/iTaskDataSource";
import { TaskRepository } from "@/src/features/tasks/data/repositories/taskRepository";
import { ProjectTask, TaskVisibility } from "@/src/features/tasks/domain/models/projectTask";

// ── Tabla en memoria que imita a Roble ─────────────────────────────
class MemoryTable {
  rows: Row[] = [];
  private next = 1;
  constructor(
    private readonly prefix: string,
    private readonly columns: Set<string> | null = null,
  ) {}
  private check(row: Row) {
    if (this.columns == null) return;
    const bad = Object.keys(row).filter((k) => !this.columns!.has(k));
    if (bad.length > 0) throw new RobleApiHttpException(400, `Columnas inválidas: ${bad.join(", ")}`);
  }
  create(row: Row): Row {
    this.check(row);
    const created = { ...row, _id: `${this.prefix}${this.next++}` };
    this.rows.push(created);
    return created;
  }
  update(id: string, changes: Row): Row {
    this.check(changes);
    const i = this.rows.findIndex((r) => r._id === id);
    if (i < 0) throw new RobleApiHttpException(404, "No existe");
    this.rows[i] = { ...this.rows[i], ...changes };
    return this.rows[i];
  }
  delete(id: string) {
    this.rows = this.rows.filter((r) => r._id !== id);
  }
  where(filters: Record<string, unknown>): Row[] {
    return this.rows.filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v));
  }
}

class FakeTaskSource implements ITaskDataSource {
  publicReads = 0;
  constructor(
    readonly tasks = new MemoryTable("t"),
    readonly priv = new MemoryTable("p"),
  ) {}
  async readForProject(projectId: string) {
    return this.tasks.where({ projectId });
  }
  async readForProjectPublic(projectId: string) {
    this.publicReads++;
    return this.tasks.where({ projectId });
  }
  async readAll() {
    return this.tasks.rows;
  }
  async readAllPublic() {
    return this.tasks.rows;
  }
  async create(row: Row) {
    return this.tasks.create(row);
  }
  async update(id: string, changes: Row) {
    return this.tasks.update(id, changes);
  }
  async delete(id: string) {
    this.tasks.delete(id);
  }
  async readPrivateForProject(projectId: string) {
    return this.priv.where({ projectId });
  }
  async createPrivate(row: Row) {
    return this.priv.create(row);
  }
  async updatePrivate(id: string, changes: Row) {
    return this.priv.update(id, changes);
  }
  async deletePrivate(id: string) {
    this.priv.delete(id);
  }
}

beforeEach(() => RobleOptionalColumns.reset());

describe("Corrección 2 · requisitos de contraseña en vivo", () => {
  test("cada requisito cambia a cumplido mientras se escribe", () => {
    const status = (p: string) => Object.fromEntries(PasswordPolicy.requirements().map((r) => [r.id, r.test(p)]));
    expect(status("")).toEqual({ length: false, upper: false, lower: false, digit: false, symbol: false });
    expect(status("Abc")).toEqual({ length: false, upper: true, lower: true, digit: false, symbol: false });
    expect(status("Abcdefg1_")).toEqual({ length: true, upper: true, lower: true, digit: true, symbol: true });
  });

  test("la lista y validate() son la misma regla (no se debilita la política)", () => {
    for (const p of ["", "ExamplePass9!", "password1!", "PASSWORD1!", "Password!!", "Password1%", "Ab1!xyz", "Abcdefg1-"]) {
      const allOk = PasswordPolicy.requirements().every((r) => r.test(p));
      expect(allOk).toBe(PasswordPolicy.validate(p) === null);
    }
  });
});

describe("Corrección 4.2 · tareas Solo equipo", () => {
  const team = (title: string) =>
    new ProjectTask({ id: "", projectId: "P1", title, description: "secreto", visibility: TaskVisibility.team });

  test("el contenido de una tarea de equipo nunca queda en la tabla pública", async () => {
    const source = new FakeTaskSource();
    const repo = new TaskRepository(source);
    await repo.sync("P1", [team("Plan interno"), new ProjectTask({ id: "", projectId: "P1", title: "Diseño", description: "abierta" })]);

    const publicRows = source.tasks.rows;
    expect(publicRows).toHaveLength(2);
    const teamRow = publicRows.find((r) => r.visibility === "team")!;
    expect(teamRow.title).toBe("");
    expect(teamRow.description).toBe("");
    expect(source.priv.rows).toEqual([expect.objectContaining({ taskId: teamRow._id, title: "Plan interno", description: "secreto" })]);
  });

  test("sin acceso de equipo la tarea viene oculta; con acceso, completa", async () => {
    const source = new FakeTaskSource();
    const repo = new TaskRepository(source);
    await repo.sync("P1", [team("Plan interno")]);

    const outsider = await repo.forProject("P1");
    expect(outsider[0]).toMatchObject({ isTeamOnly: true, hiddenContent: true, title: "" });

    const visitor = await repo.forProject("P1", { publicAccess: true, teamAccess: true });
    expect(visitor[0].hiddenContent).toBe(true); // un visitante nunca lee la tabla privada

    const member = await repo.forProject("P1", { teamAccess: true });
    expect(member[0]).toMatchObject({ hiddenContent: false, title: "Plan interno", description: "secreto" });
  });

  test("cambiar la visibilidad mueve el contenido sin cambiar el id de la tarea", async () => {
    const source = new FakeTaskSource();
    const repo = new TaskRepository(source);
    const [created] = await repo.sync("P1", [new ProjectTask({ id: "", projectId: "P1", title: "Pública", description: "d" })]);
    const id = created.id;

    await repo.setVisibility("P1", created, TaskVisibility.team);
    expect(source.tasks.rows[0]).toMatchObject({ _id: id, title: "", visibility: "team" });
    expect(source.priv.rows).toHaveLength(1);

    const [asTeam] = await repo.forProject("P1", { teamAccess: true });
    await repo.setVisibility("P1", asTeam, TaskVisibility.public);
    expect(source.tasks.rows[0]).toMatchObject({ _id: id, title: "Pública", description: "d", visibility: "public" });
    expect(source.priv.rows).toHaveLength(0);
  });

  test("las tareas de equipo no cuentan como convocatoria abierta en Explorar", async () => {
    const source = new FakeTaskSource();
    const repo = new TaskRepository(source);
    await repo.sync("P1", [team("Interna")]);
    await repo.sync("P2", [new ProjectTask({ id: "", projectId: "P2", title: "Abierta" })]);
    expect([...(await repo.projectIdsWithOpenTasks())]).toEqual(["P2"]);
  });

  test("si falta configurar Roble, explica qué crear y no deja una tarea fantasma", async () => {
    const tasks = new MemoryTable("t", new Set(["projectId", "title", "description", "requiredCount", "acceptedCount", "deadline", "status"]));
    const source = new FakeTaskSource(tasks);
    const repo = new TaskRepository(source);
    await expect(repo.sync("P1", [team("Interna")])).rejects.toThrow(/project_task_private/);
    expect(tasks.rows).toHaveLength(0);
  });

  test("las tareas públicas siguen funcionando aunque falte la columna visibility", async () => {
    const tasks = new MemoryTable("t", new Set(["projectId", "title", "description", "requiredCount", "acceptedCount", "deadline", "status"]));
    const repo = new TaskRepository(new FakeTaskSource(tasks));
    await repo.sync("P1", [new ProjectTask({ id: "", projectId: "P1", title: "Pública" })]);
    expect(tasks.rows[0]).toMatchObject({ title: "Pública" });
    expect(tasks.rows[0].visibility).toBeUndefined();
  });
});

describe("Corrección 5 · eliminación lógica de proyectos", () => {
  class FakeProjectSource implements IProjectDataSource {
    constructor(readonly table: MemoryTable) {}
    async readAll() {
      return this.table.rows;
    }
    async readAllPublic() {
      return this.table.rows;
    }
    async readById(id: string) {
      return this.table.rows.find((r) => r._id === id) ?? null;
    }
    async create(row: Row) {
      return this.table.create(row);
    }
    async update(id: string, changes: Row) {
      return this.table.update(id, changes);
    }
    async delete(id: string) {
      this.table.delete(id);
    }
  }

  const published = { name: "Huerta", description: "", isDraft: false, audience: "Toda la comunidad", createdBy: "U1" };

  test("el proyecto eliminado desaparece de Mis proyectos, Explorar y de la consulta por id", async () => {
    const table = new MemoryTable("x");
    table.create(published);
    table.create({ ...published, name: "Otro" });
    const repo = new ProjectRepository(new FakeProjectSource(table));
    const [huerta] = (await repo.ownedBy("U1")).filter((p) => p.name === "Huerta");

    await repo.softDelete(huerta);

    expect(table.rows).toHaveLength(2); // la fila se conserva (historial)
    expect((await repo.ownedBy("U1")).map((p) => p.name)).toEqual(["Otro"]);
    expect((await repo.explorable()).map((p) => p.name)).toEqual(["Otro"]);
    expect((await repo.explorable({ publicAccess: true })).map((p) => p.name)).toEqual(["Otro"]);
    expect(await repo.getById(huerta.id, { viewerId: "U1" })).toBeNull();
  });

  test("sin la columna deletedAt no cambia nada y explica qué falta", async () => {
    const table = new MemoryTable("x", new Set(["name", "description", "isDraft", "audience", "createdBy"]));
    table.rows.push({ ...published, _id: "x1" });
    const repo = new ProjectRepository(new FakeProjectSource(table));
    const [p] = await repo.ownedBy("U1");
    await expect(repo.softDelete(p)).rejects.toThrow(/deletedAt/);
    expect(table.rows[0]).toMatchObject({ isDraft: false, audience: "Toda la comunidad" });
  });
});

describe("Corrección 4.4 · comentarios con respuestas", () => {
  const c = (id: string, minutes: number, parentId: string | null = null) =>
    new ProjectComment({ id, projectId: "P1", authorName: id, text: id, createdAt: new Date(2026, 10, 10, 10, minutes), parentId });

  test("agrupa respuestas (y respuestas a respuestas) bajo su comentario", () => {
    const threads = CommentThread.build([c("a", 0), c("b", 5), c("a1", 6, "a"), c("a1x", 7, "a1"), c("huerfana", 8, "no-existe")]);
    expect(threads.map((t) => t.root.id)).toEqual(["huerfana", "b", "a"]);
    expect(threads.find((t) => t.root.id === "a")!.replies.map((r) => r.id)).toEqual(["a1", "a1x"]);
  });

  test("las respuestas guardan parentId; los comentarios principales no lo envían", async () => {
    const table = new MemoryTable("c");
    const source: ICommentDataSource = {
      readForProject: async (projectId) => table.where({ projectId }),
      readByAuthor: async () => [],
      create: async (row) => table.create(row),
    };
    const repo = new CommentRepository(source);
    const root = await repo.add(c("", 0));
    await repo.add(new ProjectComment({ id: "", projectId: "P1", authorName: "B", text: "re", createdAt: new Date(), parentId: root.id }));
    expect("parentId" in table.rows[0]).toBe(false);
    expect(table.rows[1].parentId).toBe(root.id);
    expect((await repo.forProject("P1"))[1].isReply).toBe(true);
  });

  test("si falta la columna parentId, responder explica qué crear", async () => {
    const table = new MemoryTable("c", new Set(["projectId", "authorUserId", "authorName", "text", "createdAt"]));
    const repo = new CommentRepository({
      readForProject: async () => [],
      readByAuthor: async () => [],
      create: async (row) => table.create(row),
    });
    await expect(repo.add(c("", 0))).resolves.toBeDefined();
    await expect(repo.add(c("", 1, "c1"))).rejects.toThrow(/parentId/);
  });

  test("fecha y hora del comentario", () => {
    expect(formatDateTime(new Date(2026, 10, 10, 15, 5))).toBe("10 nov 2026 · 3:05 p. m.");
    expect(formatDateTime(new Date(2026, 10, 10, 0, 30))).toBe("10 nov 2026 · 12:30 a. m.");
  });

  test("la respuesta a un comentario cae en la categoría de comentarios", () => {
    expect(NotificationCategories.ofType(AppNotificationType.commentReply)).toBe(NotificationCategory.comments);
  });
});

describe("Corrección 6 · notificaciones", () => {
  const n = (id: string, over: Partial<ConstructorParameters<typeof AppNotification>[0]> = {}) =>
    new AppNotification({
      id,
      projectId: "P1",
      title: "Nueva solicitud",
      message: "m",
      createdAt: new Date(2026, 10, 10, 10, 0, 0),
      type: AppNotificationType.newRequest,
      requestId: "R1",
      ...over,
    });

  test("quita duplicados del mismo evento y por id", () => {
    const list = dedupeNotifications([n("1"), n("2"), n("1"), n("3", { requestId: "R2" })]);
    expect(list.map((x) => x.id)).toEqual(["1", "3"]);
  });

  test("si una copia ya se leyó, el evento cuenta como leído", () => {
    expect(dedupeNotifications([n("1"), n("2", { read: true })])[0].read).toBe(true);
  });

  function controllerWith(list: AppNotification[]) {
    const marked: string[] = [];
    const controller = new NotificationsController({
      notifications: { forUser: async () => list, send: async () => {}, markRead: async (id: string) => void marked.push(id) },
      projects: {} as never,
      profiles: { byUserId: async () => null } as never,
      session: { loggedUser: { userId: "U1" } } as never,
    });
    return { controller, marked };
  }

  test("el indicador de la barra solo aparece con notificaciones sin leer", async () => {
    const { controller } = controllerWith([n("1", { read: true })]);
    await controller.refreshIfStale(0);
    expect(controller.hasUnread).toBe(false);

    const second = controllerWith([n("1"), n("2", { requestId: "R9" })]);
    await second.controller.refreshIfStale(0);
    expect(second.controller.hasUnread).toBe(true);
    await second.controller.markAllRead();
    expect(second.controller.hasUnread).toBe(false);
    expect(second.marked.sort()).toEqual(["1", "2"]);
  });

  test("marcar como leída también marca sus duplicados ocultos", async () => {
    const { controller, marked } = controllerWith([n("1"), n("2")]);
    await controller.load();
    expect(controller.visible).toHaveLength(1);
    await controller.markRead(controller.visible[0]);
    expect(marked.sort()).toEqual(["1", "2"]);
  });

  test("filtros rápidos, No leídas y búsqueda actualizan la lista", async () => {
    const { controller } = controllerWith([
      n("req"),
      n("msg", { type: AppNotificationType.newMessage, requestId: null, title: "Nuevo mensaje" }),
      n("com", { type: AppNotificationType.newComment, requestId: null, title: "Comentario en tu proyecto", read: true }),
      n("done", { type: AppNotificationType.taskCompleted, requestId: null, title: "Tarea completada" }),
    ]);
    await controller.load();
    expect(controller.visible).toHaveLength(4);

    controller.toggleQuickFilter(QuickFilter.messages, true);
    expect(controller.visible.map((x) => x.id).sort()).toEqual(["com", "msg"]);
    expect(controller.isQuickFilterOn(QuickFilter.messages)).toBe(true);

    controller.showUnread();
    expect(controller.visible.map((x) => x.id)).toEqual(["msg"]);

    controller.showAll();
    controller.toggleQuickFilter(QuickFilter.messages, false);
    controller.search.value = "tarea";
    expect(controller.visible.map((x) => x.id)).toEqual(["done"]);
    expect(QUICK_FILTERS).toHaveLength(5);
  });
});

describe("Corrección 7 · documentos de contexto (solo selección local)", () => {
  test("acepta PDF y Word, rechaza otros formatos, archivos grandes y duplicados", () => {
    expect(AttachmentPolicy.validate({ name: "Propuesta.PDF", size: 1000 }, [])).toBeNull();
    expect(AttachmentPolicy.validate({ name: "informe.docx", size: 1000 }, [])).toBeNull();
    expect(AttachmentPolicy.validate({ name: "foto.png", size: 1000 }, [])).toMatch(/no es un formato permitido/);
    expect(AttachmentPolicy.validate({ name: "sin_extension", size: 10 }, [])).toMatch(/formato/);
    expect(AttachmentPolicy.validate({ name: "grande.pdf", size: 11 * 1024 * 1024 }, [])).toMatch(/10 MB/);
    const existing = [new ProjectAttachment("a.pdf", "pdf", 10, null, "file://a")];
    expect(AttachmentPolicy.validate({ name: "a.pdf", size: 10 }, existing)).toMatch(/ya está adjunto/);
    const three = [1, 2, 3].map((i) => new ProjectAttachment(`${i}.pdf`, "pdf", i, null, "file://x"));
    expect(AttachmentPolicy.validate({ name: "4.pdf", size: 4 }, three)).toMatch(/hasta 3/);
  });
});

describe("Corrección 8 · desempeño sin datos inventados", () => {
  test("sin datos suficientes, los indicadores son null (no 0 %)", () => {
    const s = TrajectorySummary.empty;
    expect(s.collaborationOrNull).toBeNull();
    expect(s.fulfillmentOrNull).toBeNull();
    expect(s.qualityOrNull).toBeNull();
  });

  test("con datos reales, se calculan", () => {
    const s = new TrajectorySummary({
      projectsCreated: 1,
      projectsCompleted: 0,
      tasksAssigned: 2,
      tasksCompleted: 1,
      participations: 1,
      comments: 0,
      requestsSent: 3,
      requestsAccepted: 1,
      activeProjects: 2,
    });
    expect(s.fulfillmentOrNull).toBe(0.5);
    expect(s.qualityOrNull).toBeCloseTo(1 / 3);
    expect(s.collaborationOrNull).toBeCloseTo(0.4);
    expect(s.publications).toBe(1);
    expect(s.activeProjects).toBe(2);
  });
});
