import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/data/cache";
import type { DashboardFilters } from "@/lib/data/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: DashboardFilters = {
      department: params.get("department") || undefined,
      taskCategory: params.get("taskCategory") || undefined,
      app: params.get("app") || undefined,
      employeeId: params.get("employeeId") || undefined
    };
    const data = await getAnalytics(filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to build analytics dataset." }, { status: 500 });
  }
}
