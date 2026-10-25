// Turns an axios error from the ASP.NET Core API into a message we can show the user.
// Handles the three shapes this API returns: { message }, ValidationProblemDetails
// ({ title, errors }) and plain status codes (401/403/404), plus network failures.
export function extractErrorMessage(error, options = {}) {
  const {
    unauthorizedMessage = "Your session has expired. Please sign in again.",
    fallbackMessage = "Something went wrong. Please try again."
  } = options;

  if (!error?.response) {
    return "Can't reach the server. Is the API running?";
  }

  const { status, data } = error.response;

  if (data?.message) return data.message;

  // ValidationProblemDetails: errors: { "": ["..."] } or { Field: ["..."] }
  if (data?.errors) {
    const details = Object.values(data.errors).flat().filter(Boolean);
    if (details.length > 0) return details[0];
  }

  if (data?.title) return data.title;
  if (status === 401) return unauthorizedMessage;
  if (status === 403) return "You don't have access to that document.";
  if (status === 404) return "That document no longer exists.";
  return fallbackMessage;
}
