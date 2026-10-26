import { test, expect } from '../../fixtures';

test.describe('Stock and purchasing', () => {
  test.beforeEach(async ({ nitHome }) => {
    await nitHome.goto();
    await nitHome.openTool('stock');
  });

  test('flags the demo items that are below minimum @smoke', async ({ stock }) => {
    await expect(stock.alert).toHaveText('2 od 3 artikla ispod minimalne zalihe.');
    await expect(stock.status('aluminium')).toHaveText('Dovoljna zaliha');
    await expect(stock.status('steel')).toHaveText('Dopuniti najmanje 12 kg'); // 30 - 18
    await expect(stock.status('inserts')).toHaveText('Dopuniti najmanje 8 kom'); // 20 - 12
  });

  // Boundary value analysis around the steel minimum of 30 kg
  const steelBoundaries = [
    { qty: '29.9', status: 'Dopuniti najmanje 0,1 kg' }, // just below
    { qty: '30', status: 'Dovoljna zaliha' }, // exactly at minimum
    { qty: '30.1', status: 'Dovoljna zaliha' }, // just above
    { qty: '0', status: 'Dopuniti najmanje 30 kg' }, // empty
  ];
  for (const { qty, status } of steelBoundaries) {
    test(`steel at ${qty} kg shows "${status}"`, async ({ stock }) => {
      await stock.setQuantity('steel', qty);
      await expect(stock.status('steel')).toHaveText(status);
    });
  }

  test('alert clears once every item is restocked', async ({ stock }) => {
    await stock.setQuantity('steel', 30);
    await expect(stock.alert).toHaveText('1 od 3 artikla ispod minimalne zalihe.');

    await stock.setQuantity('inserts', 20);
    await expect(stock.alert).toHaveText('Svi artikli su na ili iznad minimuma.');
  });

  // Data-driven negative tests
  const invalid = [
    { item: 'inserts', value: '-1', why: 'a negative quantity' },
    { item: 'inserts', value: '12.5', why: 'half an insert (counted in pieces)' },
    { item: 'steel', value: '-0.5', why: 'negative kilograms' },
  ] as const;
  for (const { item, value, why } of invalid) {
    test(`rejects ${why}`, async ({ stock }) => {
      await stock.setQuantity(item, value);

      await expect(stock.status(item)).toHaveText('Provjerite unos');
      await expect(stock.alert).toHaveText('Ispravite unos za tačan pregled zaliha.');
    });
  }
});
