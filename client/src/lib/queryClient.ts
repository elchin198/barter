import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = "https://barter-api-8jr6.onrender.com";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`API Request: ${method} ${url}`, data);
  
  const headers: Record<string, string> = {
    "Accept": "application/json"
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-cache",
    mode: "cors"
  });
  
  console.log(`API Response: ${res.status} ${res.statusText}`, {
    headers: Array.from(res.headers.entries()),
    url: res.url,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = `${API_BASE_URL}${queryKey[0]}`;
    
    console.log(`GET Query: ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-cache",
      mode: "cors",
      headers: {
        "Accept": "application/json"
      }
    });
    
    console.log(`Query Response: ${res.status} ${res.statusText}`, {
      headers: Array.from(res.headers.entries()),
      url: res.url
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Returning null for 401 response as configured');
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`Query Data:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
