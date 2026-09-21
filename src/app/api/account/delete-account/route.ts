import { NextResponse } from "next/server";
import { getCurrentUser, SESSION_CONFIG } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/progress-sync/server-sync";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const result = await deleteUserAccount(user.id);

    const response = NextResponse.json(result);
    response.cookies.delete(SESSION_CONFIG.COOKIE_NAME);
    return response;
  } catch (err) {
    console.error("Erreur API delete account:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte." },
      { status: 500 }
    );
  }
}
