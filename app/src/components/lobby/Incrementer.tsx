import { Button } from "@/components/ui/button";

export type IncrementDirection = "increment" | "decrement";

interface Props {
  value: number;
  onChange: (direction: IncrementDirection) => void;
  disabled?: boolean;
  minValue?: number;
  maxValue?: number;
}

export function Incrementer({
  value,
  onChange,
  disabled,
  minValue,
  maxValue,
}: Props) {
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
      <span className="w-4 text-center text-xs">{value}</span>
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
