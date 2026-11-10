import { NextRequest } from "next/server";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { decideRobleRequest } from "@/lib/roble/participation-write";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  return devRobleMutation(request, async ({ config, token, identity }, body) => {
    await decideRobleRequest(config, token, identity, id, requestId, body.decision);
    return { ok: true };
  });
}
