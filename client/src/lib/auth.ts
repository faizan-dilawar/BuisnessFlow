export function getAuthToken(): string | null {
  const tokens = localStorage.getItem("tokens");
  if (!tokens) return null;
  
  try {
    const parsed = JSON.parse(tokens);
    return parsed.accessToken;
  } catch {
    return null;
  }
}

export function setAuthTokens(tokens: { accessToken: string; refreshToken: string }): void {
  localStorage.setItem("tokens", JSON.stringify(tokens));
}

export function clearAuthTokens(): void {
  localStorage.removeItem("tokens");
}
