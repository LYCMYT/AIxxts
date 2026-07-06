import {
  ManualCandidateValidationError,
  submitManualCandidate,
} from "@/server/admin/manual-candidates";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        error: "valid JSON body is required",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await submitManualCandidate(payload);

    return Response.json(result);
  } catch (error) {
    if (error instanceof ManualCandidateValidationError) {
      return Response.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
