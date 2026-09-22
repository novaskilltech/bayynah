import { NextRequest } from "next/server";
import { handlePurgeRequest } from "@/lib/pedagogical-retention-route";

export async function GET(req: NextRequest) {
  return handlePurgeRequest(req);
}

export async function POST(req: NextRequest) {
  return GET(req);
}
