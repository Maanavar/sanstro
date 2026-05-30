"use client";

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
