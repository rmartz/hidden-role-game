import { Button } from "@/components/ui/button";

interface Props {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
}

export function Incrementer({
  value,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled,
}: Props) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onDecrement}
        disabled={decrementDisabled}
      >
        −
      </Button>
      <span className="w-6 text-center text-sm">{value}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={onIncrement}
        disabled={incrementDisabled}
      >
        +
      </Button>
    </>
  );
}
