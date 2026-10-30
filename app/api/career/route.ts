import { NextResponse } from "next/server";
import { applyCareerPatch, parseCareerPatch, CareerNotionSetupError, CareerNotionConflictError } from "@/lib/career-notion";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const patch = parseCareerPatch(body);
    if (typeof patch === "string") return NextResponse.json({ ok: false, message: patch }, { status: 400 });
    const progress = await applyCareerPatch(patch);
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    if (error instanceof CareerNotionConflictError) return NextResponse.json({ ok: false, message: error.message }, { status: 409 });
    if (error instanceof CareerNotionSetupError) return NextResponse.json({ ok: false, message: error.message }, { status: 503 });
    console.error("Could not write to Notion", error);
    return NextResponse.json(
      { ok: false, message: "Notion could not confirm this update. Refresh from Notion before retrying." },
      { status: 502 },
    );
  }
}
