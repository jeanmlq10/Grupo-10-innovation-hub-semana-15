import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readPublishedProjects } from "@/lib/roble/public-projects";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token) => ({
    projects: await readPublishedProjects(config, token),
  }));
}
