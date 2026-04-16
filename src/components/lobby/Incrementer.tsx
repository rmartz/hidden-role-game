import { Button } from "@/components/ui/button";

export type IncrementDirection = "increment" | "decrement";

interface IncrementerProps {
  value: number;
  onChange: (direction: IncrementDirection) => void;
  disabled?: boolean;
  minValue?: number;
  maxValue?: number;
  /** Label to display instead of "0" when value is zero. */
  zeroLabel?: string;
}

export function Incrementer({
  value,
  onChange,
  disabled,
  minValue,
  maxValue,
  zeroLabel,
}: IncrementerProps) {
  function handleDecrement() {
    onChange("decrement");
  }

  function handleIncrement() {
    onChange("increment");
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon-xs"
        onClick={handleDecrement}
        disabled={disabled ?? (minValue !== undefined && value <= minValue)}
      >
        −
      </Button>
      <span className="w-4 text-center text-xs">
        {value === 0 && zeroLabel ? zeroLabel : value}
      </span>
      <Button
        variant="outline"
        size="icon-xs"
        onClick={handleIncrement}
        disabled={disabled ?? (maxValue !== undefined && value >= maxValue)}
      >
        +
      </Button>
    </>
  );
}
