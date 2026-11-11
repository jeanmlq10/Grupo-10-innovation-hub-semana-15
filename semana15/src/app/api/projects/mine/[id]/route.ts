import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readOwnProjectDetail } from "@/lib/roble/own-project-detail";
import { devRobleProjectWrite } from "@/lib/roble/dev-write";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleRead(request, async (config, token, userId) => {
    const project = await readOwnProjectDetail(config, token, userId, id);
    return project ? { project } : null;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleProjectWrite(request, id);
}
