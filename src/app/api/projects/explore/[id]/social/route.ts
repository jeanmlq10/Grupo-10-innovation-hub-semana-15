import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { addProjectComment, readProjectSocial, setProjectFollow } from "@/lib/roble/project-social";
import { ProjectWriteFailure } from "@/lib/roble/project-write";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleRead(request, async (config, token, userId) => {
    try { return await readProjectSocial(config, token, userId, id); }
    catch (cause) { if (cause instanceof ProjectWriteFailure && cause.status === 404) return null; throw cause; }
  });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleMutation(request, async ({ config, token, identity }, body) => {
    if (body.action === "comment") return { id: await addProjectComment(config, token, identity, id, body) };
    if (body.action === "follow" && typeof body.follow === "boolean") return { following: await setProjectFollow(config, token, identity, id, body.follow) };
    throw new ProjectWriteFailure(400, "Acción no válida.");
  });
}
