'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit, Loader2 } from 'lucide-react';
import { Stat } from './stat'; // Assuming Stat component is in the same directory

import { type ComponentType } from 'react';

interface EditableStatProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  displayValue?: string;
  hint?: string;
  onSave: (newValue: number) => void;
  isPending: boolean;
}

export function EditableStat({ icon, label, value, displayValue, hint, onSave, isPending }: EditableStatProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value.toString());

  const handleSave = () => {
    const numericValue = parseFloat(currentValue);
    if (!isNaN(numericValue)) {
      onSave(numericValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative p-4 border border-dashed rounded-lg">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="h-8 text-lg font-semibold"
            disabled={isPending}
          />
          <Button size="icon" variant="ghost" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Stat icon={icon} label={label} value={displayValue || value.toString()} hint={hint} />
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 h-6 w-6"
        onClick={() => setIsEditing(true)}
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
}
