"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownOption, MissingRateYear } from "./utils/types";

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  id?: string;
  options: DropdownOption[];
  searchPlaceholder: string;
  emptyText: string;
  showSecondaryText?: boolean;
}

export function Combobox({
  value,
  onValueChange,
  placeholder,
  id,
  options,
  searchPlaceholder,
  emptyText,
  showSecondaryText = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 px-4 bg-white border border-gray-300 hover:bg-gray-50 transition-all"
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          filter={(itemValue, search) => {
            const option = options.find((opt) => opt.label === itemValue);
            if (!option) return 0;
            const searchLower = search.toLowerCase();
            const labelMatch = option.label.toLowerCase().includes(searchLower);
            const valueMatch = option.value.toLowerCase().includes(searchLower);
            return labelMatch || valueMatch ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {showSecondaryText ? (
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{option.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        HS6: {option.value}
                      </span>
                    </div>
                  ) : (
                    <span className="truncate">{option.label}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function LoadingSkeleton({ isCalculating }: { isCalculating: boolean }) {
  return (
    <div className="h-[300px] w-full rounded-xl shadow-lg bg-white p-4 flex items-center justify-center">
      <div className="w-full h-full flex flex-col gap-4">
        {isCalculating && (
          <div className="text-center mb-4">
            <p className="text-muted-foreground">Calculating tariff data...</p>
          </div>
        )}
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function EmptyDataPlaceholder() {
  return (
    <div className="h-[300px] w-full rounded-xl shadow-lg bg-white p-4 flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-2">No data available</p>
        <p className="text-sm text-muted-foreground">
          Select countries, product, and trade value, then click Calculate
          Tariff
        </p>
      </div>
    </div>
  );
}

export function MissingRateWarning({
  missingYears,
}: {
  missingYears: MissingRateYear[];
}) {
  if (missingYears.length === 0) return null;

  return (
    <Alert variant="warning" className="mt-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Tariff Data</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Tariff rates could not be found for the following year(s):
        </p>
        <ul className="list-disc list-inside space-y-1">
          {missingYears.map((item) => (
            <li key={item.year}>
              <strong>{item.year}</strong>: {item.reason}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          This typically means no applicable tariff rate (MFN, preferential, or
          suspension) exists in the database for this product and country
          combination on the query date.
        </p>
      </AlertDescription>
    </Alert>
  );
}
