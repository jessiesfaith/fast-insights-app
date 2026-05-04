// Shared keyboard-shortcut utilities — every global hot-key uses these so we
// consistently skip when the user is typing in a form field.

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export interface ShortcutDef {
  keys: string[];           // displayed & matched verbatim against KeyboardEvent.key
  label: string;
  hint: string;             // free-form description for the help overlay
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: ['?'], label: 'Help',                 hint: 'Toggle this shortcut overlay' },
  { keys: ['p', 'P'], label: 'Presentation',    hint: 'Toggle full-screen presentation mode' },
  { keys: ['/'], label: 'Search',               hint: 'Focus the exception search box' },
  { keys: ['j'], label: 'Next exception',       hint: 'Move to the next row in the queue' },
  { keys: ['k'], label: 'Prev exception',       hint: 'Move to the previous row in the queue' },
  { keys: ['r'], label: 'Toggle resolved',      hint: 'Resolve / re-open the selected exception' },
  { keys: ['Escape'], label: 'Close',           hint: 'Dismiss the overlay' },
];
