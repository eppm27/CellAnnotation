import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatShortcut, getModifierSymbol, useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMemo } from "react";

const Harness = ({
  enabled = true,
  onAction,
}: {
  enabled?: boolean;
  onAction: (label: string) => void;
}) => {
  const shortcuts = useMemo(
    () => [
      {
        key: "k",
        ctrl: true,
        description: "Trigger action",
        callback: () => onAction("fired"),
      },
      {
        key: "Escape",
        description: "Dismiss",
        callback: () => onAction("escape"),
        preventDefault: false,
      },
    ],
    [onAction],
  );
  useKeyboardShortcuts({ shortcuts, enabled });
  return <input aria-label="field" />;
};

describe("useKeyboardShortcuts", () => {
  it("invokes callback for matching shortcut", () => {
    const handler = vi.fn();
    render(<Harness onAction={handler} />);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(handler).toHaveBeenCalledWith("fired");
  });

  it("ignores shortcuts when disabled", () => {
    const handler = vi.fn();
    render(<Harness onAction={handler} enabled={false} />);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("allows escape inside inputs", () => {
    const handler = vi.fn();
    render(<Harness onAction={handler} />);

    const input = screen.getByLabelText("field");
    input.focus();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(handler).toHaveBeenCalledWith("escape");
  });

  it("formats shortcuts for display", () => {
    expect(getModifierSymbol()).toMatch(/Ctrl|⌘/);
    expect(
      formatShortcut({ key: "ArrowUp", ctrl: true, shift: true, callback: vi.fn() }),
    ).toContain("↑");
  });
});
