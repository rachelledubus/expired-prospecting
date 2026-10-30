import { NextResponse } from "next/server";
import { upsertExpiredProperty, type ExpiredPropertySyncInput } from "@/lib/propertyResearch";

const NOTION_VERSION = "2022-06-28";

export async function POST(request: Request) {
  const { property, crmPageIds } = (await request.json()) as {
    property?: ExpiredPropertySyncInput;
    crmPageIds?: string[];
  };

  if (!property?.address || !property.city || !property.zip) {
    return NextResponse.json({ error: "Property address, city, and ZIP are required." }, { status: 400 });
  }

  const ownerIds = Array.from(new Set((crmPageIds ?? property.crmPageIds ?? []).filter(Boolean)));
  const result = await upsertExpiredProperty({
    ...property,
    crmPageIds: ownerIds,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  if (result.premiumMailerEligible !== null && ownerIds.length > 0) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Notion is not configured on the server." }, { status: 500 });
    }

    for (const crmPageId of ownerIds) {
      const premiumRes = await fetch(`https://api.notion.com/v1/pages/${crmPageId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            "Premium Mailer Eligible": { checkbox: result.premiumMailerEligible },
          },
        }),
      });
      const premiumData = await premiumRes.json();
      if (!premiumRes.ok) {
        return NextResponse.json(
          { error: premiumData?.message ?? "CRM premium-mailer sync failed.", partial: true, property: result },
          { status: 502 }
        );
      }
    }
  }

  return NextResponse.json({ ok: true, property: result });
}
