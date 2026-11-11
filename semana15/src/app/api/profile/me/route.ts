import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readOwnProjects, readRobleRows } from "@/lib/roble/own-projects";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { profileForOwner, publicProfileFields, saveOwnProfile } from "@/lib/roble/profile-write";

const row = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token, userId) => {
    const [profiles, projects, members] = await Promise.all([
      readRobleRows(config, token, "user_profiles", { userId }),
      readOwnProjects(config, token, userId),
      readRobleRows(config, token, "project_members", { userId }),
    ]);
    const profile = profileForOwner(profiles, userId);
    return {
      profile: profile ? publicProfileFields(profile) : null,
      stats: {
        projectsCreated: projects.filter(project => !project.isDraft).length,
        participations: members.map(row).filter(item => item && text(item.userId) === userId).length,
      },
    };
  });
}

export async function PATCH(request: NextRequest) {
  return devRobleMutation(request, async ({ config, token, identity }, body) => ({ profile: await saveOwnProfile(config, token, identity, body) }));
}
