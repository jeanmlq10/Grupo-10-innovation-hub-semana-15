import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleOptionalColumns } from "@/src/core/roble/robleOptionalColumns";
import { RobleRows } from "@/src/core/roble/robleRows";
import { RobleSchema } from "@/src/core/roble/robleSchema";
import { RobleApiForbiddenException, RobleApiHttpException } from "@/src/core/roble/sdk/robleExceptions";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { Project } from "../../domain/models/project";
import { ProjectTeamRole } from "../../domain/models/projectTeamRole";
import { ProjectFailure } from "../../domain/projectFailure";
import { IProjectRepository } from "../../domain/repositories/iProjectRepository";
import { IProjectDataSource } from "../datasources/iProjectDataSource";

/**
 * Proyectos: decide la visibilidad, convierte filas en [Project] y traduce
 * errores a [ProjectFailure]. No habla con Roble directamente.
 */
export class ProjectRepository implements IProjectRepository {
  private static readonly optionalColumns = new Set(["createdAt", "teamDeadline", "imageFileId"]);

  constructor(private readonly source: IProjectDataSource) {}

  private guard<T>(action: () => Promise<T>, notFound?: string) {
    return robleGuard(action, (m) => new ProjectFailure(m), { notFound });
  }

  async create(project: Project): Promise<Project> {
    const row = await this.guard(() =>
      RobleOptionalColumns.write(
        { ...this.toRow(project), createdBy: project.createdBy, createdAt: RobleRows.nowIso() },
        (r) => this.source.create(r),
        { optional: ProjectRepository.optionalColumns },
      ),
    );
    return this.toProject(row);
  }

  async save(project: Project): Promise<Project> {
    const row = await this.guard(
      () =>
        RobleOptionalColumns.write(this.toRow(project), (r) => this.source.update(project.id, r), {
          optional: ProjectRepository.optionalColumns,
        }),
      "Ese proyecto no existe o no es tuyo.",
    );
    return Object.keys(row).length === 0 ? project : this.toProject(row);
  }

  async delete(id: string): Promise<void> {
    await this.guard(async () => {
      try {
        await this.source.delete(id);
      } catch (e) {
        if (e instanceof RobleApiHttpException && (e instanceof RobleApiForbiddenException || e.statusCode === 403)) {
          throw new ProjectFailure(
            "Roble no permite borrar proyectos todavía: en la consola, " +
              'Configuración → Permisos, dale al rol "user" el permiso Borrar ' +
              "en la tabla projects.",
          );
        }
        throw e;
      }
    }, "Ese proyecto no existe o no es tuyo.");
  }

  /**
   * Eliminación lógica de un proyecto publicado: marca `deletedAt` (y lo
   * vuelve privado) en vez de borrar la fila. Así no se pierden ni quedan
   * huérfanos los registros que dependen de él y que pertenecen a otras
   * personas (solicitudes, comentarios, seguimientos, integrantes,
   * notificaciones), que el creador no tiene permiso de borrar en Roble.
   */
  async softDelete(project: Project): Promise<void> {
    await this.guard(async () => {
      try {
        await this.source.update(project.id, {
          deletedAt: RobleRows.nowIso(),
          isDraft: true,
          audience: "Solo yo",
        });
      } catch (e) {
        if (RobleSchema.isMissingColumn(e, "deletedAt")) {
          throw new ProjectFailure(
            "Para eliminar proyectos publicados falta la columna deletedAt (text) en la tabla projects de Roble. " +
              "Ver ROBLE_CAMBIOS.md.",
          );
        }
        throw e;
      }
    }, "Ese proyecto no existe o no es tuyo.");
  }

  async getById(
    id: string,
    { viewerId, publicAccess = false }: { viewerId?: string | null; publicAccess?: boolean } = {},
  ): Promise<Project | null> {
    if (!id) return null;
    let row: Row | null;
    if (publicAccess) {
      const rows = await this.publicRows();
      row = rows.find((r) => RobleRows.str(r._id) === id) ?? null;
    } else {
      row = await this.guard(() => this.source.readById(id));
    }
    if (!row) return null;
    const project = this.toProject(row);
    if (project.isDeleted) return null;
    const visible = project.isPublic || (viewerId != null && project.createdBy === viewerId);
    return visible ? project : null;
  }

  async explorable({ publicAccess = false }: { publicAccess?: boolean } = {}): Promise<Project[]> {
    const rows = publicAccess ? await this.publicRows() : await this.guard(() => this.source.readAll());
    return rows.map((r) => this.toProject(r)).filter((p) => p.isPublic);
  }

  async ownedBy(userId: string): Promise<Project[]> {
    const rows = await this.guard(() => this.source.readAll());
    return rows.map((r) => this.toProject(r)).filter((p) => p.createdBy === userId && !p.isDeleted);
  }

  private publicRows(): Promise<Row[]> {
    return this.guard(async () => {
      try {
        return await this.source.readAllPublic();
      } catch (e) {
        if (e instanceof RobleApiForbiddenException) {
          throw new ProjectFailure(
            "Los proyectos no se pueden ver sin iniciar sesión todavía: " +
              "la tabla projects no es pública en Roble.",
          );
        }
        throw e;
      }
    });
  }

  rolesOf(project: Project): ProjectTeamRole[] {
    return Object.entries(project.teamRoles)
      .filter(([, needed]) => needed > 0)
      .map(
        ([role, needed]) =>
          new ProjectTeamRole({
            id: role,
            projectId: project.id,
            role,
            numberNeeded: needed,
            numberAccepted: project.acceptedRoleCounts[role] ?? 0,
            status: (project.acceptedRoleCounts[role] ?? 0) >= needed ? "closed" : "open",
          }),
      );
  }

  private toRow(p: Project): Row {
    return {
      name: p.name,
      description: p.description,
      categories: p.categories,
      canApply: p.canApply,
      teamRoles: p.teamRoles,
      acceptedRoleCounts: p.acceptedRoleCounts,
      duration: p.duration,
      audience: p.audience,
      isDraft: p.isDraft,
      acceptedMembersCount: p.acceptedMembersCount,
      createdByName: p.createdByName,
      teamDeadline: RobleRows.dayIso(p.teamDeadline),
      ...(p.imageFileId ? { imageFileId: p.imageFileId } : {}),
    };
  }

  private toProject(row: Row): Project {
    return new Project({
      id: RobleRows.str(row._id),
      name: RobleRows.str(row.name),
      description: RobleRows.str(row.description),
      categories: RobleRows.stringList(row.categories),
      canApply: RobleRows.boolean(row.canApply, true),
      teamRoles: RobleRows.intMap(row.teamRoles),
      acceptedRoleCounts: RobleRows.intMap(row.acceptedRoleCounts),
      duration: RobleRows.strOrNull(row.duration),
      audience: RobleRows.strOrNull(row.audience),
      isDraft: RobleRows.boolean(row.isDraft, true),
      acceptedMembersCount: RobleRows.integer(row.acceptedMembersCount),
      createdBy: RobleRows.author(row, "createdBy"),
      createdByName: RobleRows.strOrNull(row.createdByName),
      createdAt: RobleRows.date(row.createdAt),
      teamDeadline: RobleRows.day(row.teamDeadline),
      imageUrl: RobleRows.strOrNull(row.imageUrl),
      imageFileId: RobleRows.strOrNull(row.imageFileId),
      objectives: RobleRows.stringList(row.objectives),
      stage: RobleRows.strOrNull(row.stage),
      deletedAt: RobleRows.date(row.deletedAt),
    });
  }
}
