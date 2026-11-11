import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readMyRequests } from "@/lib/roble/my-activity";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token, userId) => ({
    requests: await readMyRequests(config, token, userId),
  }));
}
