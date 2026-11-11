import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readRobleRows } from "@/lib/roble/own-projects";
import { profileForOwner, publicProfileFields } from "@/lib/roble/profile-write";
import { publishedProjectsFromResponse } from "@/lib/roble/projects";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id || id.length > 100) return Response.json({ error: "Perfil no disponible." }, { status: 404 });
  return devRobleRead(request, async (config, token, viewerId) => {
    const rows = await readRobleRows(config, token, "user_profiles", { userId: id });
    const profile = profileForOwner(rows, id);
    if (!profile) return null;
    const fields = publicProfileFields(profile);
    if (id !== viewerId && fields.profileVisibility === "private") return null;
    const showActivity = id === viewerId || fields.activityVisibility === "everyone";
    const projects = showActivity ? await readRobleRows(config, token, "projects", { _owner: id }) : [];
    const projectCount = publishedProjectsFromResponse(projects).filter(project => projects.some(value => {
      const row = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
      return row?._id === project.id && row?._owner === id;
    })).length;
    return { profile: { name: fields.name, username: fields.username, bio: fields.bio, career: fields.career, avatarIcon: fields.avatarIcon,
      contactPermission: fields.contactPermission }, own: id === viewerId, stats: showActivity ? { projectsCreated: projectCount } : null };
  }, "Este perfil no existe o es privado.");
}
