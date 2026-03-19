export const PLAYER_ROW_COPY = {
  leaveTitle: "Leave this lobby?",
  leaveDescription: "You will be removed from the lobby.",
  leaveConfirm: "Leave",
  leaveCancel: "Cancel",
  removeTitle: (name: string) => `Remove ${name} from the lobby?`,
  removeDescription: "This player will be removed from the lobby.",
  removeConfirm: "Remove",
  removeCancel: "Cancel",
  transferTitle: (name: string) => `Make ${name} the lobby owner?`,
  transferDescription:
    "You will lose owner privileges and this player will become the new lobby owner.",
  transferConfirm: "Transfer",
  transferCancel: "Cancel",
  leaveButton: "Leave",
  removeButton: "Remove",
  makeOwnerButton: "Make Owner",
} as const;
