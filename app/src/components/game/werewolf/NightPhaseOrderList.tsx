import { getPhaseLabel } from "@/lib/game-modes/werewolf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NightPhaseOrderListProps {
  nightPhaseOrder: string[];
  currentPhaseIndex: number;
  roles: Record<string, { name: string }>;
  phasePlayerNames?: Record<string, string[]>;
}

export function NightPhaseOrderList({
  nightPhaseOrder,
  currentPhaseIndex,
  roles,
  phasePlayerNames,
}: NightPhaseOrderListProps) {
  if (nightPhaseOrder.length === 0) return null;

  const currentPhaseKey = nightPhaseOrder[currentPhaseIndex];

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Night Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion defaultValue={currentPhaseKey ? [currentPhaseKey] : []}>
          {nightPhaseOrder.map((phaseKey, index) => {
            const isCurrent = index === currentPhaseIndex;
            const isPast = index < currentPhaseIndex;
            const label = getPhaseLabel(phaseKey, roles);
            const playerNames = phasePlayerNames?.[phaseKey] ?? [];
            return (
              <AccordionItem
                key={`${phaseKey}-${String(index)}`}
                value={phaseKey}
                className={isPast ? "opacity-40" : undefined}
              >
                <AccordionTrigger>
                  <span className="text-muted-foreground mr-2 tabular-nums">
                    {String(index + 1)}.
                  </span>
                  {label}
                  {isCurrent && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (current)
                    </span>
                  )}
                </AccordionTrigger>
                {playerNames.length > 0 && (
                  <AccordionContent>
                    <ul className="space-y-0.5 ml-5">
                      {playerNames.map((name) => (
                        <li
                          key={name}
                          className="text-xs text-muted-foreground"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
