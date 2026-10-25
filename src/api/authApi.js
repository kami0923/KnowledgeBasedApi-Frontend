import axiosClient from "./axiosClient";
import { extractErrorMessage as extractMessage } from "./errorMessages";

// Maps directly to AuthController.Register(RegisterDto dto) -> POST api/Auth/register
export async function registerUser({ name, email, password }) {
  const response = await axiosClient.post("/Auth/register", {
    name,
    email,
    password
  });
  return response.data; // AuthResponseDto: { token, name, email }
}

// Maps directly to AuthController.Login(LoginDto dto) -> POST api/Auth/login
export async function loginUser({ email, password }) {
  const response = await axiosClient.post("/Auth/login", {
    email,
    password
  });
  return response.data; // AuthResponseDto: { token, name, email }
}

// Kept for the auth screens: here a 401 can only mean bad credentials.
// The document endpoints use extractDocumentErrorMessage instead.
export function extractErrorMessage(error) {
  return extractMessage(error, {
    unauthorizedMessage: "Invalid email or password."
  });
}

