import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readOwnTrajectory } from "@/lib/roble/trajectory";

export async function GET(request: NextRequest) {
  return devRobleRead(request, (config, token, userId) => readOwnTrajectory(config, token, userId));
}
