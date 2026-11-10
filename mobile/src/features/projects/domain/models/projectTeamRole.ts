/**
 * A long-term role the project needs in its team ("Diseñador/a",
 * "Líder de proyecto"...), with how many people are needed and how many
 * were already accepted.
 */
export class ProjectTeamRole {
  readonly id: string;
  readonly projectId: string;
  readonly role: string;
  readonly numberNeeded: number;
  readonly numberAccepted: number;
  readonly status: string;

  constructor(p: {
    id: string;
    projectId: string;
    role: string;
    numberNeeded?: number;
    numberAccepted?: number;
    status?: string;
  }) {
    this.id = p.id;
    this.projectId = p.projectId;
    this.role = p.role;
    this.numberNeeded = p.numberNeeded ?? 1;
    this.numberAccepted = p.numberAccepted ?? 0;
    this.status = p.status ?? "open";
  }

  get hasSpots(): boolean {
    return this.numberAccepted < this.numberNeeded;
  }
}
