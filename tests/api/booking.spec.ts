import { test, expect } from '../../fixtures';
import { newBooking } from '../../utils/testData';

/**
 * API tests run in the "api" project: no browser, just HTTP through
 * Playwright's request fixture. Each test creates its own data.
 */
test.describe('Booking API', () => {
  test('health check responds @smoke', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201); // Restful Booker returns 201 Created for /ping
  });

  test('create a booking and read it back @smoke', async ({ bookingApi }) => {
    const payload = newBooking();

    const created = await bookingApi.create(payload);
    expect(created.status()).toBe(200);
    const { bookingid, booking } = await created.json();
    expect(bookingid).toEqual(expect.any(Number));
    expect(booking).toEqual(payload);

    const fetched = await bookingApi.get(bookingid);
    expect(fetched.ok()).toBeTruthy();
    expect(await fetched.json()).toEqual(payload);
  });

  test('filter bookings by guest name', async ({ bookingApi }) => {
    const payload = newBooking();
    const { bookingid } = await (await bookingApi.create(payload)).json();

    const res = await bookingApi.findByName(payload.firstname, payload.lastname);
    expect(res.ok()).toBeTruthy();
    const ids = (await res.json()).map((b: { bookingid: number }) => b.bookingid);
    expect(ids).toContain(bookingid);
  });

  test('full update requires auth and replaces the booking', async ({ bookingApi }) => {
    const { bookingid } = await (await bookingApi.create(newBooking())).json();
    await bookingApi.authenticate();

    const updated = newBooking({ totalprice: 999, depositpaid: false, additionalneeds: 'Late checkout' });
    const res = await bookingApi.update(bookingid, updated);

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(updated);
  });

  test('partial update changes only the given fields', async ({ bookingApi }) => {
    const original = newBooking();
    const { bookingid } = await (await bookingApi.create(original)).json();
    await bookingApi.authenticate();

    const res = await bookingApi.partialUpdate(bookingid, { totalprice: 42 });

    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toEqual({ ...original, totalprice: 42 });
  });

  test('delete without a token is forbidden', async ({ bookingApi }) => {
    const { bookingid } = await (await bookingApi.create(newBooking())).json();

    const res = await bookingApi.delete(bookingid, false);

    expect(res.status()).toBe(403);
  });

  test('delete with a token removes the booking', async ({ bookingApi }) => {
    const { bookingid } = await (await bookingApi.create(newBooking())).json();
    await bookingApi.authenticate();

    const res = await bookingApi.delete(bookingid);
    expect(res.status()).toBe(201); // documented quirk of this API

    const after = await bookingApi.get(bookingid);
    expect(after.status()).toBe(404);
  });

  test('bad credentials do not return a token', async ({ request }) => {
    const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' } });
    const body = await res.json();
    expect(body.token).toBeUndefined();
    expect(body.reason).toBe('Bad credentials');
  });
});
