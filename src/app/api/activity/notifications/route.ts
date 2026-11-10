import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readMyNotifications } from "@/lib/roble/my-activity";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token, userId) => ({
    notifications: await readMyNotifications(config, token, userId),
  }));
}
