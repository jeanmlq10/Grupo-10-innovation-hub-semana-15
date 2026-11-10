import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readOwnProjects, readRobleRows } from "@/lib/roble/own-projects";

const row = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token, userId) => {
    const [profiles, projects, members] = await Promise.all([
      readRobleRows(config, token, "user_profiles", { userId }),
      readOwnProjects(config, token, userId),
      readRobleRows(config, token, "project_members", { userId }),
    ]);
    const profile = profiles.map(row).find(item => item && text(item.userId) === userId);
    return {
      profile: profile ? {
        name: text(profile.name), username: text(profile.username), bio: text(profile.bio),
        career: text(profile.career), avatarIcon: text(profile.avatarIcon),
      } : null,
      stats: {
        projectsCreated: projects.filter(project => !project.isDraft).length,
        participations: members.map(row).filter(item => item && text(item.userId) === userId).length,
      },
    };
  });
}
