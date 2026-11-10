import { NextRequest } from "next/server";
import { devRobleRead } from "@/lib/roble/dev-read";
import { readOwnProjects } from "@/lib/roble/own-projects";
import { devRobleProjectWrite } from "@/lib/roble/dev-write";

export async function GET(request: NextRequest) {
  return devRobleRead(request, async (config, token, userId) => ({
    projects: await readOwnProjects(config, token, userId),
  }));
}

export async function POST(request: NextRequest) { return devRobleProjectWrite(request); }
