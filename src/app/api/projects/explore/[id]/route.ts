import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readPublishedProjectDetail } from "@/lib/roble/public-projects";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleRead(request, async (config, token, userId) => {
    const project = await readPublishedProjectDetail(config, token, id, userId);
    return project ? { project } : null;
  }, "El proyecto no existe o no está publicado.");
}
