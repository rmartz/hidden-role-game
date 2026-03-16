import { getPhaseLabel } from "@/lib/game-modes/werewolf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";

interface NightPhaseOrderListProps {
  nightPhaseOrder: string[];
  currentPhaseIndex: number;
  roles: Record<string, { name: string }>;
  teamLabels?: Partial<Record<string, string>>;
}

export function NightPhaseOrderList({
  nightPhaseOrder,
  currentPhaseIndex,
  roles,
  teamLabels,
}: NightPhaseOrderListProps) {
  if (nightPhaseOrder.length === 0) return null;

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Night Order</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-none space-y-1">
          {nightPhaseOrder.map((phaseKey, index) => {
            const isCurrent = index === currentPhaseIndex;
            const isPast = index < currentPhaseIndex;
            const label = getPhaseLabel(phaseKey, roles, teamLabels);
            return (
              <Item
                key={`${phaseKey}-${String(index)}`}
                size="sm"
                variant={isCurrent ? "muted" : "default"}
                className={isPast ? "opacity-40" : undefined}
              >
                <ItemContent>
                  <ItemTitle>
                    <span className="text-muted-foreground mr-2 tabular-nums">
                      {String(index + 1)}.
                    </span>
                    {label}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (current)
                      </span>
                    )}
                  </ItemTitle>
                </ItemContent>
              </Item>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
