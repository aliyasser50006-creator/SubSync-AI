'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NewJobButton() {
  return (
    <Button className="shadow-md btn-gradient" onClick={() => document.getElementById('videoTitle')?.focus()}>
      <Plus className="mr-2 h-4 w-4" />
      New Job
    </Button>
  );
}
