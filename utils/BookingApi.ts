import { type APIRequestContext, type APIResponse, expect } from '@playwright/test';
import { type Booking, bookerAdmin } from './testData';

/**
 * Thin client for the Restful Booker API. Keeps endpoints and auth in one
 * place so specs read like test cases, not HTTP plumbing.
 */
export class BookingApi {
  private token?: string;

  constructor(private readonly request: APIRequestContext) {}

  async authenticate(): Promise<string> {
    const res = await this.request.post('/auth', { data: bookerAdmin });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.token, 'auth should return a token').toBeTruthy();
    this.token = body.token as string;
    return this.token;
  }

  private authHeaders() {
    if (!this.token) throw new Error('Call authenticate() before a protected request');
    return { Cookie: `token=${this.token}` };
  }

  create(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  findByName(firstname: string, lastname: string): Promise<APIResponse> {
    return this.request.get('/booking', { params: { firstname, lastname } });
  }

  update(id: number, booking: Booking): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: this.authHeaders() });
  }

  partialUpdate(id: number, fields: Partial<Booking>): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: fields, headers: this.authHeaders() });
  }

  delete(id: number, withAuth = true): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: withAuth ? this.authHeaders() : {} });
  }
}
