import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readProjectFiles } from "@/lib/roble/project-files";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleRead(request, async (config, token, userId) => {
    const files = await readProjectFiles(config, token, userId, id);
    return files ? { files } : null;
  }, "Proyecto no disponible.");
}
