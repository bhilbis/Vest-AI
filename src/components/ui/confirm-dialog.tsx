"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirmStore } from "@/lib/confirm-store";
import { TriangleAlert } from "lucide-react";

export function ConfirmDialog() {
  const { isOpen, options, handleConfirm, handleCancel } = useConfirmStore();
  const isDestructive = options.variant === "destructive";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader className="text-center sm:text-center items-center">
          {isDestructive && (
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="h-5 w-5 text-destructive" />
            </div>
          )}
          <DialogTitle>{options.title}</DialogTitle>
          {options.description && (
            <DialogDescription className="text-sm leading-relaxed text-center">
              {options.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
          >
            {options.cancelLabel ?? "Batal"}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            className="flex-1"
            onClick={handleConfirm}
          >
            {options.confirmLabel ?? "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
