'use client';

// src/components/crud/crud-form-dialog.tsx
// A reusable dialog wrapper for Create / Edit forms in CRUD pages.

import { type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CrudFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  children: ReactNode;
}

export function CrudFormDialog({
  open,
  onOpenChange,
  title,
  isSubmitting,
  onSubmit,
  children,
}: CrudFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>{children}</div>

        <DialogFooter className='gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='button' onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
