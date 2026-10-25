import { NextResponse } from "next/server";
import { applyCareerPatch, parseCareerPatch } from "@/lib/career-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const patch = parseCareerPatch(body);
    if (typeof patch === "string") return NextResponse.json({ ok: false, message: patch }, { status: 400 });
    const progress = await applyCareerPatch(patch);
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    console.error("Could not save career progress", error);
    return NextResponse.json(
      { ok: false, message: "Could not save your changes. Nothing was marked complete. Try again." },
      { status: 500 },
    );
  }
}
