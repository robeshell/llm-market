"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MenuSelectOption = {
  value: string;
  label: string;
};

export function MenuSelect({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  options: MenuSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const listId = `${triggerId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected =
    options.find((opt) => opt.value === value) ?? options[0] ?? null;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={["menu-select", className].filter(Boolean).join(" ")}>
      <label className="menu-select-label" htmlFor={triggerId}>
        {label}
      </label>
      <div className="menu-select-control" ref={rootRef}>
        <button
          id={triggerId}
          type="button"
          className="menu-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-select-value">{selected?.label ?? value}</span>
          <span className="menu-select-caret" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </button>
        {open ? (
          <ul
            id={listId}
            className="menu-select-list"
            role="listbox"
            aria-labelledby={triggerId}
          >
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <li key={opt.value} role="presentation">
                  <button
                    type="button"
                    className={
                      isActive
                        ? "menu-select-option menu-select-option-active"
                        : "menu-select-option"
                    }
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
