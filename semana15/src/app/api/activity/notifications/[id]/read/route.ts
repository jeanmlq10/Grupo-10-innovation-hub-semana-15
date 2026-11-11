import { NextRequest } from "next/server";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { markRobleNotificationRead } from "@/lib/roble/participation-write";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleMutation(request, async ({ config, token, identity }) => {
    await markRobleNotificationRead(config, token, identity, id);
    return { ok: true };
  });
}
