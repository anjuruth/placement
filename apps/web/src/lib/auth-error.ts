type AuthErrorDetails = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorDetails(error: unknown): AuthErrorDetails {
  if (isRecord(error) && isRecord(error.error)) {
    return {
      code: typeof error.error.code === "string" ? error.error.code : undefined,
      message: typeof error.error.message === "string" ? error.error.message : undefined,
      status: typeof error.error.status === "number" ? error.error.status : undefined,
      statusText: typeof error.error.statusText === "string" ? error.error.statusText : undefined,
    };
  }

  if (isRecord(error)) {
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : undefined,
      status: typeof error.status === "number" ? error.status : undefined,
      statusText: typeof error.statusText === "string" ? error.statusText : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {};
}

export function getAuthErrorMessage(error: unknown, action: "signIn" | "signUp" | "social" = "signIn") {
  const details = getErrorDetails(error);
  const code = details.code?.toUpperCase();
  const message = details.message?.trim();
  const statusText = details.statusText?.trim();
  const combined = `${message ?? ""} ${statusText ?? ""}`.toLowerCase();

  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "INVALID_PASSWORD" || code === "INVALID_EMAIL") {
    return "Invalid email or password.";
  }

  if (code === "USER_NOT_FOUND" || code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
    return "No account was found for this email and password.";
  }

  if (code === "EMAIL_NOT_VERIFIED") {
    return "Your email is not verified. Please verify your email before signing in.";
  }

  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (code === "PROVIDER_NOT_FOUND") {
    return "The requested sign-in provider is not configured.";
  }

  if (code === "EMAIL_PASSWORD_DISABLED") {
    return "Email/password sign-in is disabled in auth configuration.";
  }

  if (
    code === "INVALID_ORIGIN" ||
    code === "MISSING_OR_NULL_ORIGIN" ||
    code === "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED" ||
    combined.includes("cors") ||
    combined.includes("origin")
  ) {
    return "Authentication request origin is not allowed. Check BETTER_AUTH_URL and CORS_ORIGIN.";
  }

  if (combined.includes("fetch") || combined.includes("network")) {
    return "Unable to reach the authentication service. Check that the app is running and auth URL is correct.";
  }

  if (action === "signIn" && (combined.includes("login failed") || combined.includes("unauthorized"))) {
    return "Sign in failed. Double-check your credentials. If they are correct, verify BETTER_AUTH_URL and CORS_ORIGIN.";
  }

  if (details.status === 500) {
    return "Authentication server error. Check server logs and auth environment configuration.";
  }

  if (message) {
    return message;
  }

  if (statusText) {
    return statusText;
  }

  return action === "signUp" ? "Sign up failed." : "Sign in failed.";
}

export function getAuthErrorDetails(error: unknown) {
  return getErrorDetails(error);
}
