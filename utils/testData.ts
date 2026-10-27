/**
 * Central place for test data. Credentials come from env vars with the
 * public demo values as fallbacks, so the suite runs out of the box.
 */
export const users = {
  standard: {
    username: process.env.SAUCE_USERNAME ?? 'standard_user',
    password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
  },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
  invalid: { username: 'not_a_user', password: 'wrong_password' },
} as const;

export const bookerAdmin = {
  username: process.env.BOOKER_USERNAME ?? 'admin',
  password: process.env.BOOKER_PASSWORD ?? 'password123',
};

export const checkoutCustomer = {
  firstName: 'Ana',
  lastName: 'Kovač',
  postalCode: '72000',
};

export const products = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  onesie: 'Sauce Labs Onesie',
  redTShirt: 'Test.allTheThings() T-Shirt (Red)',
} as const;

/** Builds a unique booking payload so parallel API tests never collide. */
export function newBooking(overrides: Partial<Booking> = {}): Booking {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    firstname: `QA-${id}`,
    lastname: 'Automation',
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2026-11-01', checkout: '2026-11-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}
