"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckIcon, CopyIcon, ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  lobbyId: string;
}

export function ShareLobby({ lobbyId }: Props) {
  const [copied, setCopied] = useState(false);
  const lobbyUrl = `${window.location.origin}/lobby/${lobbyId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(lobbyUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  }

  async function handleShare() {
    await navigator.share({
      url: lobbyUrl,
      title: "Join my Hidden Role Game lobby",
    });
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShareIcon />
        Invite Players
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Players</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <QRCodeSVG value={lobbyUrl} size={200} />
          <p className="text-sm text-muted-foreground text-center break-all">
            {lobbyUrl}
          </p>
        </div>

        <DialogFooter>
          {canShare && (
            <Button variant="outline" onClick={() => void handleShare()}>
              <ShareIcon />
              Share
            </Button>
          )}
          <Button onClick={() => void handleCopy()}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
