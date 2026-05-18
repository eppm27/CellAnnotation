import { useEffect } from "react";

// Detect if user is on Mac
const isMac =
  typeof window !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;

// Helper to check if the modifier key is pressed (Cmd on Mac, Ctrl on Windows/Linux)
const isModifierKey = (e: KeyboardEvent) => {
  return isMac ? e.metaKey : e.ctrlKey;
};

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean; // Ctrl on Windows/Linux, Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  description?: string;
  callback: (e: KeyboardEvent) => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Custom hook to handle keyboard shortcuts
 * @param options Configuration object with shortcuts and enabled state
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except for specific cases)
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const modifierMatch = shortcut.ctrl
          ? isModifierKey(e)
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (modifierMatch && shiftMatch && altMatch && keyMatch) {
          // For some shortcuts like Escape, allow them even in input fields
          const allowInInput = ["Escape", "Enter"].includes(shortcut.key);

          if (!isInputField || allowInInput) {
            if (shortcut.preventDefault !== false) {
              e.preventDefault();
            }
            shortcut.callback(e);
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
};

/**
 * Get the platform-specific modifier key symbol
 */
export const getModifierSymbol = () => (isMac ? "⌘" : "Ctrl");

/**
 * Get a formatted keyboard shortcut string for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(getModifierSymbol());
  }
  if (shortcut.shift) {
    parts.push("⇧");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  // Format the key nicely
  let keyDisplay = shortcut.key;
  const keyMappings: Record<string, string> = {
    Escape: "Esc",
    Delete: "Del",
    Backspace: "⌫",
    " ": "Space",
    "+": "+",
    "-": "-",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
  };

  if (keyMappings[shortcut.key]) {
    keyDisplay = keyMappings[shortcut.key];
  } else {
    keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);

  return parts.join(" + ");
};
