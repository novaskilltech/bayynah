import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportUserData } from "@/lib/progress-sync/server-sync";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise pour exporter vos données." },
        { status: 401 }
      );
    }

    const exportData = await exportUserData(user.id);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="tabayyun-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    console.error("Erreur API export:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'export des données." },
      { status: 500 }
    );
  }
}
