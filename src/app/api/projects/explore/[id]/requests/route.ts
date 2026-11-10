import { NextRequest } from "next/server";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { submitRobleRequest } from "@/lib/roble/participation-write";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return devRobleMutation(request, async ({ config, token, identity }, body) => ({
    id: await submitRobleRequest(config, token, identity, id, body),
  }), 201);
}
