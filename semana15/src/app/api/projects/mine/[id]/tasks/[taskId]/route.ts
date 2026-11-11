import { NextRequest } from "next/server";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { updateOwnedTaskStatus } from "@/lib/roble/project-actions";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  return devRobleMutation(request, async ({ config, token, identity }, body) => {
    await updateOwnedTaskStatus(config, token, identity, id, taskId, body.status);
    return { status: body.status };
  });
}
