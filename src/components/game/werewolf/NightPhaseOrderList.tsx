import { getPhaseLabel } from "@/lib/game/modes/werewolf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";

interface NightPhaseOrderListProps {
  nightPhaseOrder: string[];
  currentPhaseIndex: number;
  roles: Record<string, { name: string }>;
}

export function NightPhaseOrderList({
  nightPhaseOrder,
  currentPhaseIndex,
  roles,
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
            const label = getPhaseLabel(phaseKey, roles);
            return (
              <Item
                key={`${phaseKey}-${String(index)}`}
                render={<li />}
                size="sm"
                variant={isCurrent ? "muted" : "default"}
              >
                <ItemContent>
                  <ItemTitle className={isPast ? "line-through" : undefined}>
                    <span className="mr-2 tabular-nums">
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
