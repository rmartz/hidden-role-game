import type { paths } from './types';

type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: Methods,
    path: string,
    options?: {
      body?: unknown;
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Game endpoints
  createGame() {
    return this.request<paths['/game/create']['post']['responses']['200']['content']['application/json']>(
      'POST',
      '/game/create'
    );
  }

  getGame(gameId: string) {
    return this.request<paths['/game/{gameId}']['get']['responses']['200']['content']['application/json']>(
      'GET',
      `/game/${gameId}`
    );
  }

  joinGame(gameId: string, playerName: string) {
    return this.request<paths['/game/{gameId}/join']['post']['responses']['201']['content']['application/json']>(
      'POST',
      `/game/${gameId}/join`,
      {
        body: { playerName },
      }
    );
  }
}
