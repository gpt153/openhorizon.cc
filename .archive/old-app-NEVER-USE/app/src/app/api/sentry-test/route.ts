import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const testType = request.nextUrl.searchParams.get("type") || "error";

  try {
    if (testType === "error") {
      // Test 1: Throw an error to test error tracking
      throw new Error("This is a test error from Sentry integration test");
    } else if (testType === "message") {
      // Test 2: Send a message to Sentry
      Sentry.captureMessage("Test message from Sentry integration", "info");
      return NextResponse.json({
        success: true,
        message: "Test message sent to Sentry",
      });
    } else if (testType === "context") {
      // Test 3: Send error with custom context
      Sentry.withScope((scope) => {
        scope.setTag("test-tag", "integration-test");
        scope.setContext("test-context", {
          testKey: "testValue",
          timestamp: new Date().toISOString(),
        });
        scope.setUser({
          id: "test-user-123",
          email: "test@example.com",
        });
        Sentry.captureException(
          new Error("Test error with custom context")
        );
      });
      return NextResponse.json({
        success: true,
        message: "Test error with custom context sent to Sentry",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid test type. Use ?type=error, ?type=message, or ?type=context" },
        { status: 400 }
      );
    }
  } catch (error) {
    // This error will be automatically captured by Sentry
    throw error;
  }
}
