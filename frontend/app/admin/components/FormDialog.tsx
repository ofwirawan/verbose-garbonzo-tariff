"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  size?: "sm" | "lg";
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  size = "sm",
}: FormDialogProps) {
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const sizeClasses = {
    sm: "sm:max-w-[425px]",
    lg: "sm:max-w-[600px]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <form onSubmit={handleSubmitClick} className="flex flex-col max-h-[calc(100vh-180px)] w-full px-6 py-6">
          <DialogHeader className="space-y-2 flex-shrink-0 w-full">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1 min-h-0 w-full px-2">
            {children}
          </div>
          <DialogFooter className="flex-shrink-0 w-full">
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
