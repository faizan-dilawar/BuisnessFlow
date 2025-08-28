export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<Response> {
  const tokens = localStorage.getItem("tokens");
  const auth = tokens ? JSON.parse(tokens) : null;
  console.log("auth",auth)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth?.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  const res = await fetch(url,
     {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  
    ...options,
  });
  console.log("API URL",res)
  if (!res.ok) {
    const error = await res.text();
  console.log("error",error)

    throw new Error(error || res.statusText);
  }

  return res;
}
export async function apiDownload(
  url: string,
  options: RequestInit = {}
): Promise<Blob> {
  const tokens = localStorage.getItem("tokens");
  const auth = tokens ? JSON.parse(tokens) : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (auth?.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    ...options,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || res.statusText);
  }

  return await res.blob();
}
