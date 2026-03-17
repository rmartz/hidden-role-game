"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckIcon, ClipboardIcon, ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareLobbyProps {
  lobbyId: string;
  gameMode: string;
}

export function ShareLobby({ lobbyId, gameMode }: ShareLobbyProps) {
  const [copied, setCopied] = useState(false);
  const lobbyUrl = `${window.location.origin}/${gameMode}/lobby/${lobbyId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(lobbyUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
          <div className="relative">
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-2 py-0.5 text-xs text-background animate-in fade-in slide-in-from-bottom-1 duration-150">
                Copied!
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground text-center break-all hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckIcon className="size-3.5 shrink-0" />
              ) : (
                <ClipboardIcon className="size-3.5 shrink-0" />
              )}
              {lobbyUrl}
            </button>
          </div>
        </div>

        {canShare && (
          <DialogFooter>
            <Button onClick={() => void handleShare()}>
              <ShareIcon />
              Share
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
