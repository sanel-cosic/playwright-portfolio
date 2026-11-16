import { type Locator, type Page, expect } from '@playwright/test';
import { parseFinish } from '../../utils/nitData';
import { BusinessSystemPage } from './BusinessSystemPage';

/** 03 Plan proizvodnje: slot picker, clash check, weekly grid. */
export class PlanPage extends BusinessSystemPage {
  readonly blockedHeading: Locator;
  readonly openMaterialLink: Locator;
  readonly machine: Locator;
  readonly machineHint: Locator;
  readonly startDay: Locator;
  readonly startTime: Locator;
  readonly slotStatus: Locator;
  readonly finish: Locator;
  readonly confirmButton: Locator;
  readonly firstFreeButton: Locator;
  readonly trackLink: Locator;

  constructor(page: Page) {
    super(page, 'plan');
    this.blockedHeading = page.getByRole('heading', { name: 'Prvo osigurajte materijal' });
    this.openMaterialLink = page.getByRole('link', { name: 'Otvori materijal →' });
    this.machine = page.getByRole('combobox', { name: 'Mašina' });
    this.machineHint = page.getByText('Prikazane su odgovarajuće mašine.');
    this.startDay = page.getByRole('combobox', { name: 'Dan početka' });
    this.startTime = page.getByRole('combobox', { name: 'Početak rada' });
    this.slotStatus = this.workspace.getByRole('status').first();
    this.finish = page.getByText(/^Procijenjeni završetak:/);
    this.confirmButton = page.getByRole('button', { name: 'Potvrdi termin' });
    this.firstFreeButton = page.getByRole('button', { name: 'Prvi slobodan termin' });
    this.trackLink = page.getByRole('link', { name: 'Prati izvršenje →' });
  }

  /** Weekly grid entry of an order on a machine's row, named like "RN-2609 · 15,0 h". */
  gridChip(orderId: string, machine: string): Locator {
    return this.machineRow(machine).getByRole('button', { name: new RegExp(`^${orderId} · \\d`) });
  }

  /** Weekly grid row of a machine, e.g. machineRow('CNC-01'); no role exists for it. */
  machineRow(machine: string): Locator {
    return this.page.locator('.machine-row').filter({ hasText: machine });
  }

  /** machine is the id ('CNC-01'); option labels are like "CNC-01 · Glodalica · 3 ose". */
  async chooseSlot(machine: string, day: string, time: string) {
    const label = await this.machine
      .locator('option', { hasText: new RegExp(`^${machine}\\b`) })
      .first()
      .innerText();
    await this.machine.selectOption({ label: label.trim() });
    await this.startDay.selectOption({ label: day });
    await this.startTime.selectOption({ label: time });
  }

  async finishDate(): Promise<Date> {
    return parseFinish(await this.finish.innerText());
  }

  /** Confirms the current slot, taking the first free one if it clashes. */
  async confirmFreeSlot() {
    if (await this.confirmButton.isDisabled()) {
      await this.firstFreeButton.click();
    }
    await expect(this.confirmButton).toBeEnabled();
    await this.confirmButton.click();
    await expect(this.kpi('Status plana')).toContainText('Termin potvrđen');
  }
}
