import { authorizePersonaAdmin, personaErrorResponse, PersonaError } from "../../../../lib/personas/index.js";
import { getSafetyLabSnapshot } from "../../../../lib/safety-lab/snapshot.js";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new PersonaError("Cross-origin administration is not allowed", 403);
    // Authenticate before returning even aggregate evaluation information.
    await authorizePersonaAdmin(request);
    return Response.json({ snapshot: getSafetyLabSnapshot() }, {
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    });
  } catch (error) {
    return personaErrorResponse(error);
  }
}
