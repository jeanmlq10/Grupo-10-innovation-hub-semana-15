import { NextRequest } from "next/server";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { softDeleteOwnedProject } from "@/lib/roble/project-actions";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleMutation(request, async ({ config, token, identity }) => {
    await softDeleteOwnedProject(config, token, identity, id);
    return { deleted: true };
  });
}
