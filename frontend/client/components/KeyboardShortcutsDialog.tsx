import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Keyboard } from "lucide-react";
import { getModifierSymbol } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  category: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

const KeyboardShortcutsDialog = ({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) => {
  const mod = getModifierSymbol();

  const shortcutCategories: ShortcutItem[] = [
    {
      category: "General",
      shortcuts: [
        { keys: `${mod} + Z`, description: "Undo last action" },
        { keys: `${mod} + Y`, description: "Redo last undone action" },
        {
          keys: `${mod} + ⇧ + Z`,
          description: "Redo last undone action (alternative)",
        },
        { keys: `${mod} + S`, description: "Export annotations" },
        { keys: "Esc", description: "Deselect annotation" },
      ],
    },
    {
      category: "Tools",
      shortcuts: [
        { keys: "1", description: "Select tool" },
        { keys: "2", description: "Pan tool" },
        { keys: "3", description: "Circle tool" },
        { keys: "4", description: "Rectangle tool" },
        { keys: "5", description: "Freehand tool" },
        { keys: "6", description: "Measurement tool" },
        { keys: "7", description: "Eraser tool" },
        { keys: "8", description: "Text tool" },
      ],
    },
    {
      category: "Viewing",
      shortcuts: [
        { keys: "+/=", description: "Zoom in" },
        { keys: "-", description: "Zoom out" },
        { keys: "G", description: "Toggle grid" },
      ],
    },
    {
      category: "Annotations",
      shortcuts: [
        { keys: "Del", description: "Delete selected annotation" },
        { keys: "⌫", description: "Delete selected annotation" },
        { keys: "Esc", description: "Deselect annotation" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Keyboard className="w-6 h-6" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to work faster and more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          {shortcutCategories.map((category) => (
            <Card key={category.category}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 text-medical-blue">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1.5 text-sm font-mono bg-muted rounded border shadow-sm">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Press{" "}
            <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border shadow-sm">
              ?
            </kbd>{" "}
            or{" "}
            <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border shadow-sm">
              Shift + /
            </kbd>{" "}
            anytime to view this help dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
