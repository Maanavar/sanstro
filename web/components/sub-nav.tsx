"use client";

// ORPHANED 2026-08-08 — NOT IMPORTED ANYWHERE. Several live files discuss their
// own "sub-nav", but as prose about a `<Segmented>` control, not as a use of this
// component. Verified by sweeping every import specifier in web/, packages/ and
// mobile/. Do not fix a bug here — find the file that ships.
// See docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F11. Deletion is a separate,
// per-file decision and has not been made.

interface SubNavItem {
  id: string;
  label: string;
}

interface SubNavProps {
  items: SubNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SubNav({ items, activeId, onSelect }: SubNavProps) {
  return (
    <nav className="sub-nav" role="tablist" aria-label="Section navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeId === item.id}
          className={`sub-nav__item${activeId === item.id ? " sub-nav__item--active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
