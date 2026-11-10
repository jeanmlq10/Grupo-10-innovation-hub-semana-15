import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { devRobleMutation } from "@/lib/roble/dev-write";
import { readMyMessages, sendRobleMessage } from "@/lib/roble/messages";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token, userId) => ({
    messages: await readMyMessages(config, token, userId), userId,
  }));
}

export async function POST(request: NextRequest) {
  return devRobleMutation(request, async ({ config, token, identity }, body) => ({
    id: await sendRobleMessage(config, token, identity, String(body.toUserId ?? ""), String(body.text ?? "")),
  }), 201);
}
