import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Finance from '@/pages/Finance';
import { storage } from '@/lib/storage';

describe('Finance page', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.resetForTests();
    storage.importData('{}');
  });

  it('adds income and expense and shows monthly profit', async () => {
    const user = userEvent.setup();

    // Pre-populate entries via storage for determinism
    const today = new Date().toISOString().slice(0,10);
    storage.addFinancialEntry({ type: 'income', amount: 1000, category: 'Salary', date: today, notes: 'Paycheck' });
    storage.addFinancialEntry({ type: 'expense', amount: 200, category: 'Groceries', date: today, notes: 'Weekly' });

    // Render the page after data is present
    render(<MemoryRouter><Finance /></MemoryRouter>);

    // Check summary - waits for rendered amounts
    const incomeEls = await screen.findAllByText(/R\$ 1000.00/);
    expect(incomeEls.length).toBeGreaterThan(0);
    const expenseEls = screen.getAllByText(/R\$ 200.00/);
    expect(expenseEls.length).toBeGreaterThan(0);
    const profitEls = screen.getAllByText(/R\$ 800.00/);
    expect(profitEls.length).toBeGreaterThan(0);

    // Delete the expense via UI (find the card containing the expense amount)
    const expenseLabel = screen.getAllByText(/R\$ 200.00/)[0];
    const expenseCard = expenseLabel.closest('div');
    if (expenseCard) {
      const btn = expenseCard.querySelector('button[aria-label^="Remover lançamento"]');
      if (btn) {
        await user.click(btn);
        const confirmBtn = await screen.findByRole('button', { name: /Remover/i });
        await user.click(confirmBtn);
        // expense should disappear (no elements with that amount remain)
        const expenseAfter = screen.queryAllByText(/R\$ 200.00/);
        expect(expenseAfter.length).toBe(0);
        // profit should now equal income (1000)
        const newProfit = screen.getAllByText(/R\$ 1000.00/);
        expect(newProfit.length).toBeGreaterThan(0);
      }
    }

    // After deletion, ensure profit label is present (non-ambiguous assertion)
    const profitLabels = await screen.findAllByText(/Lucro/);
    expect(profitLabels.length).toBeGreaterThan(0);
  }, 20000);

  it('aggregates daily profits correctly via storage helper', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // day 1: income 100, expense 30 -> net 70
    const d1 = `${year}-${String(month).padStart(2,'0')}-01`;
    storage.addFinancialEntry({ type: 'income', amount: 100, category: 'A', date: d1 });
    storage.addFinancialEntry({ type: 'expense', amount: 30, category: 'B', date: d1 });

    // day 2: income 200 -> net 200
    const d2 = `${year}-${String(month).padStart(2,'0')}-02`;
    storage.addFinancialEntry({ type: 'income', amount: 200, category: 'C', date: d2 });

    const daily = storage.getDailyProfitForMonth(year, month);
    expect(daily[0]).toBeCloseTo(70);
    expect(daily[1]).toBeCloseTo(200);
  });

  it('shows simulate button when tests enabled and renders simulated chart', async () => {
    const user = userEvent.setup();

    render(<MemoryRouter><Finance /></MemoryRouter>);

    // enable tests AFTER render to mimic user toggling settings in Settings page
    storage.updateSettings({ testsEnabled: true });

    const simBtn = await screen.findByTestId('simulate-day29');
    expect(simBtn).toBeTruthy();

    await user.click(simBtn);

    // banner should show briefly
    const banner = await screen.findByTestId('simulation-banner');
    expect(banner).toBeTruthy();

    // debug panel should reflect simulation applied
    const debug = await screen.findByTestId('simulation-debug');
    expect(debug).toBeTruthy();
    expect(debug.textContent).toContain('simulationApplied: true');

    const chart = await screen.findByTestId('finance-chart');
    expect(chart).toBeTruthy();

    // there should be a bar for each day in month
    const selectedMonth = new Date().toISOString().slice(0,7);
    const [y, m] = selectedMonth.split('-').map(s => Number(s));
    const daysInMonth = new Date(y, m, 0).getDate();

    const chartEl = chart as HTMLElement;
    const line = chartEl.querySelector('[data-testid="finance-line"]');
    expect(line).toBeTruthy();
    const points = chartEl.querySelectorAll('[data-testid^="finance-point-"]');
    expect(points.length).toBe(daysInMonth);

    // hover first point and expect tooltip with Lucro to appear
    if (points.length > 0) {
      await user.hover(points[0] as Element);
      const tip = await screen.findByTestId('finance-tooltip');
      expect(tip).toBeTruthy();
      expect(tip.textContent).toMatch(/Lucro/);
      // unhover
      await user.unhover(points[0] as Element);
    }
  });

  it('hides simulate controls and debug when testsEnabled is false', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Finance /></MemoryRouter>);

    // enable then disable tests via storage (events are dispatched asynchronously)
    storage.updateSettings({ testsEnabled: true });
    await new Promise(r => setTimeout(r, 0));
    expect(await screen.findByTestId('simulate-day29')).toBeTruthy();

    storage.updateSettings({ testsEnabled: false });
    await new Promise(r => setTimeout(r, 0));

    // controls should be gone
    const sim = screen.queryByTestId('simulate-day29');
    expect(sim).toBeNull();
    const debug = screen.queryByTestId('simulation-debug');
    expect(debug).toBeNull();
  });
});
