"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditableRowProps {
  label: string;
  value: string | number | null | undefined;
  displayValue?: string | number | null | undefined;
  fieldName: string;
  action: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  inputType?: "text" | "number" | "date" | "select" | "email" | "tel";
  options?: { label: string; value: string }[];
  className?: string;
}

const initialState = {
  success: false,
  error: undefined as string | undefined,
};

export function EditableRow({
  label,
  value,
  displayValue,
  fieldName,
  action,
  inputType = "text",
  options = [],
  className,
}: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Wrapper to handle toast and open/close logic is handled via side effect or derived state?
  // useActionState doesn't accept a callback for success/error easily inside the render.
  // We can wrap the action to do side effects before returning, but toast is client side.
  // Best practice with useActionState: monitor 'state' with useEffect.

  const [state, formAction, isPending] = useActionState(action, initialState);

  // Effect to handle success/error toasts or state changes
  // We need to track if the state *just* changed.
  // But simpler: just render the error if present.
  // Or: create a wrapper action that we pass to useActionState that calls the server action
  // BUT: the server action runs on server. We can't toast there.
  // So we use useEffect on `state`.

  // However, triggering toast in useEffect on every render with success=true is bad.
  // We need a ref to track if we've shown it, or relying on the state update timestamp.
  // A cleaner way often used:
  // Since this component unmounts the form when switching back to view mode,
  // we might want to keep the form open on error.

  // Let's rely on the returned state to close the form if success.
  if (state?.success && isEditing) {
      // This is safe because state comes from the action we just ran.
      // But we need to avoid infinite loop or flickering.
      // We can use a small effect or just toggle right here? No, bad for render.
      // Use helper effect.
  }
  
  // Actually, to keep it simple and robust:
  // We'll trust the 'state' to tell us if we are successful.
  // If successful, we can show toast and close field.
  
  // Re-implementing with useEffect for side-effects
  
  return (
    <EditableRowContent 
      label={label}
      value={value}
      displayValue={displayValue}
      fieldName={fieldName}
      action={action}
      inputType={inputType}
      options={options}
      className={className}
    />
  );
}

function EditableRowContent({
  label,
  value,
  displayValue,
  fieldName,
  action,
  inputType,
  options,
  className,
}: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.success) {
        setIsEditing(false);
        toast.success(`${label} updated successfully`);
    } else {
        toast.error(result.error || "Update failed");
    }
    return result;
  }, initialState);

  const shownValue = displayValue !== undefined ? displayValue : (value || "N/A");

  if (!isEditing) {
    return (
      <div
        className={cn(
          "group flex items-center justify-between py-1 min-h-[44px]",
          className
        )}
      >
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground capitalize">{label}</p>
          <p className="text-sm font-medium break-words capitalize">{shownValue || "N/A"}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {label}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("py-1 min-h-[44px]", className)}>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <form action={formAction} className="flex items-center gap-2">
        <div className="flex-1">
          {inputType === "select" ? (
            <Select name={fieldName} defaultValue={String(value || "")}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              name={fieldName}
              type={inputType}
              defaultValue={String(value || "")}
              className="h-8"
              autoFocus
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 bg-green-600 hover:bg-green-700"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(false)}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
      {state?.error && (
        <p className="text-[10px] text-red-500 mt-1">{state.error}</p>
      )}
    </div>
  );
}
