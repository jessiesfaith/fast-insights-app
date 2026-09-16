// @vitest-environment jsdom
//
// ARR and Churn — the page itself. This is the only suite in the repo that
// needs a DOM, so the environment is set per-file rather than globally: the
// other suites keep running in the faster node environment.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArrAndChurn from '../pages/ArrAndChurn';

afterEach(cleanup);

const renderPage = () =>
  render(
    <MemoryRouter>
      <ArrAndChurn />
    </MemoryRouter>
  );

/** The <section> a heading belongs to, so "$0" in one section can't answer for another. */
const section = (heading: string): HTMLElement => {
  const el = screen.getByRole('heading', { name: heading }).closest('section');
  if (!el) throw new Error(`no <section> around the "${heading}" heading`);
  return el as HTMLElement;
};

describe('ArrAndChurn — the page', () => {
  it('renders both columns and all three sections', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'ARR and Churn' })).toBeDefined();
    // Each column is named once at the top and again above every section.
    expect(screen.getAllByText('For-profit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not-for-profit').length).toBeGreaterThan(0);
    for (const s of ['ARR', 'NAR', 'Churn']) {
      expect(screen.getByRole('heading', { name: s })).toBeDefined();
    }
  });

  it('starts empty, with the empty-state copy and no bridge', () => {
    renderPage();
    const arr = section('ARR');
    expect(within(arr).getAllByText('$0').length).toBeGreaterThan(0);
    expect(within(arr).queryByText('$1,995,000')).toBeNull();
    expect(within(arr).getAllByText('The bridge draws itself once there are figures above.')).toHaveLength(2);
  });

  it('Run demo fills both columns; Clear empties them again', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Run demo' }));

    const arr = section('ARR');
    expect(within(arr).getAllByText('$1,995,000').length).toBeGreaterThan(0);
    expect(within(arr).getAllByText('$1,210,000').length).toBeGreaterThan(0);
    // The retention headlines come along with them.
    expect(within(section('NAR')).getAllByText('92.2%').length).toBeGreaterThan(0);
    expect(within(section('NAR')).getAllByText('63.8%').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(within(section('ARR')).queryByText('$1,995,000')).toBeNull();
    expect(within(section('ARR')).queryByText('$1,210,000')).toBeNull();
    expect(within(section('ARR')).getAllByText('$0').length).toBeGreaterThan(0);
  });

  it('the demo status pills read as reviewed', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Run demo' }));
    expect(screen.getByText('Up 24.7% for the year')).toBeDefined();
    expect(screen.getByText('Down 6.9% for the year')).toBeDefined();
    expect(screen.getByText('Base shrinking slowly')).toBeDefined();
    expect(screen.getByText('Typical for the sector')).toBeDefined();
    expect(screen.getByText('Moderate')).toBeDefined();
    expect(screen.getByText('Around sector norm')).toBeDefined();
  });

  it('accepts a pasted "$1,250.00" and shows it grouped on blur', () => {
    renderPage();
    const input = screen.getByLabelText('Total revenue, last 12 months') as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '$1,250.00' } });
    fireEvent.blur(input);

    expect(input.value).toBe('1,250');
  });

  it('clamps a negative entry to zero', () => {
    renderPage();
    const input = screen.getByLabelText('Beginning ARR') as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '-500' } });
    fireEvent.blur(input);

    expect(input.value).toBe('0');
  });

  it('labels both charts for screen readers once there are figures', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Run demo' }));
    expect(screen.getAllByRole('img', { name: 'Bridge from the beginning figure to the ending figure' })).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: 'Gross and net retention against 100%' })).toHaveLength(2);
  });
});
