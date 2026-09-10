import { NextResponse } from "next/server";
import { upsertExpiredProperty, type ExpiredPropertySyncInput } from "@/lib/propertyResearch";

export async function POST(request: Request) {
  const { property, crmPageIds } = (await request.json()) as {
    property?: ExpiredPropertySyncInput;
    crmPageIds?: string[];
  };

  if (!property?.address || !property.city || !property.zip) {
    return NextResponse.json({ error: "Property address, city, and ZIP are required." }, { status: 400 });
  }

  const result = await upsertExpiredProperty({
    ...property,
    crmPageIds: Array.from(new Set((crmPageIds ?? property.crmPageIds ?? []).filter(Boolean))),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, property: result });
}
