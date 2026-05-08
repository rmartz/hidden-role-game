import Link from "next/link";
import { HOME_LINK_COPY } from "./HomeLink.copy";

export function HomeLink() {
  return (
    <Link
      href="/"
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      ← {HOME_LINK_COPY.label}
    </Link>
  );
}
