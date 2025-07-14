const apiURL = '/api';

type ApiResponse<T> = {
  data?: T;
  message?: string;
  error?: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as ApiResponse<T>;
  
  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred');
    (error as any).status = response.status;
    throw error;
  }
  
  return data as T;
}

const api = {
  async postJson<T = void, U = unknown>(
    route: string, 
    payload: U,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(apiURL + route, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(payload),
      ...options,
    });

    return handleResponse<T>(response);
  },

  async get<T = void>(
    route: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(apiURL + route, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return handleResponse<T>(response);
  },
};

export default api;