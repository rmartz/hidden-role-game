/** Available theme identifiers for Secret Villain. */
export enum SvTheme {
  Default = "default",
  Original = "original",
  StarWars = "star-wars",
  Business = "business",
}

/** Theme-sensitive labels for Secret Villain UI. */
export interface SvThemeLabels {
  /** Display name of the theme. */
  name: string;
  /** Good team name (e.g. "Liberal", "Jedi"). */
  goodTeam: string;
  /** Bad team name (e.g. "Fascist", "Sith"). */
  badTeam: string;
  /** Good role display name (e.g. "Liberal", "Jedi"). */
  goodRole: string;
  /** Bad role display name (e.g. "Fascist", "Sith Lord"). */
  badRole: string;
  /** Special Bad role display name (e.g. "Hitler", "Palpatine"). */
  specialBadRole: string;
  /** Good policy card label (e.g. "Liberal Policy", "Jedi Policy"). */
  goodPolicy: string;
  /** Bad policy card label (e.g. "Fascist Policy", "Sith Policy"). */
  badPolicy: string;
  /** Good policy track label on the board. */
  goodTrack: string;
  /** Bad policy track label on the board. */
  badTrack: string;
  /** Game over: good team wins message. */
  goodWins: string;
  /** Game over: bad team wins message. */
  badWins: string;
  /** Shoot action label (e.g. "Shoot", "Execute", "Fire"). */
  shootAction: string;
  /** Shoot action heading (e.g. "Execution", "Order 66", "Termination"). */
  shootHeading: string;
  /** Shoot action instruction (e.g. "Select a player to execute."). */
  shootInstruction: string;
  /** Shoot action confirm button label. */
  shootConfirm: string;
  /** Special Bad marker text shown next to name (e.g. "(Hitler)", "(Palpatine)"). */
  specialBadMarker: string;
  /** Starting screen: heading for the bad team allies list. */
  badTeamHeading: string;
  /** Starting screen: description shown to bad team members above the allies list. */
  badTeamDescription: string;
  /** Starting screen: message shown to good team members. */
  goodTeamMessage: string;
  /** Starting screen: message shown to the special bad player. */
  specialBadMessage: string;
  /** Starting screen: description shown to the special bad when they can see their bad ally. */
  specialBadAllyDescription: string;
  /** Vote yes button label (e.g. "Ja!", "Sure", "Yes"). */
  voteYes: string;
  /** Vote no button label (e.g. "Nein!", "Wait", "No"). */
  voteNo: string;
}

export const SV_THEMES: Record<SvTheme, SvThemeLabels> = {
  [SvTheme.Default]: {
    name: "Default",
    goodTeam: "Good",
    badTeam: "Bad",
    goodRole: "Good Role",
    badRole: "Bad Role",
    specialBadRole: "Special Bad Role",
    goodPolicy: "Good",
    badPolicy: "Bad",
    goodTrack: "Good Policies",
    badTrack: "Bad Policies",
    goodWins: "Good Team Wins!",
    badWins: "Bad Team Wins!",
    shootAction: "Eliminate",
    shootHeading: "Execution",
    shootInstruction: "Select a player to eliminate.",
    shootConfirm: "Eliminate",
    specialBadMarker: "(Special Bad)",
    badTeamHeading: "Your Allies",
    badTeamDescription:
      "These players are on the Bad team. One of them is the Special Bad \u2014 they raised their thumb but kept their eyes closed.",
    goodTeamMessage:
      "Close your eyes and wait. The Bad team is identifying each other.",
    specialBadMessage:
      "Close your eyes and raise your thumb. The other Bad players will see you.",
    specialBadAllyDescription: "This player is on the Bad team.",
    voteYes: "Yes",
    voteNo: "No",
  },
  [SvTheme.Original]: {
    name: "Original",
    goodTeam: "Liberal",
    badTeam: "Fascist",
    goodRole: "Liberal",
    badRole: "Fascist",
    specialBadRole: "Hitler",
    goodPolicy: "Liberal Policy",
    badPolicy: "Fascist Policy",
    goodTrack: "Liberal Policies",
    badTrack: "Fascist Policies",
    goodWins: "Liberals Win!",
    badWins: "Fascists Win!",
    shootAction: "Shoot",
    shootHeading: "Execution",
    shootInstruction: "Select a player to shoot.",
    shootConfirm: "Shoot",
    specialBadMarker: "(Hitler)",
    badTeamHeading: "Your Allies",
    badTeamDescription:
      "These players are Fascists. One of them is Hitler \u2014 they raised their thumb but kept their eyes closed.",
    goodTeamMessage:
      "Close your eyes and wait. The Fascist team is identifying each other.",
    specialBadMessage:
      "Close your eyes and raise your thumb. The other Fascists will see you.",
    specialBadAllyDescription: "This player is a Fascist.",
    voteYes: "Ja!",
    voteNo: "Nein!",
  },
  [SvTheme.StarWars]: {
    name: "Star Wars",
    goodTeam: "Jedi",
    badTeam: "Sith",
    goodRole: "Jedi",
    badRole: "Sith Lord",
    specialBadRole: "Palpatine",
    goodPolicy: "Jedi Policy",
    badPolicy: "Sith Policy",
    goodTrack: "Jedi Policies",
    badTrack: "Sith Policies",
    goodWins: "The Jedi Win!",
    badWins: "The Sith Win!",
    shootAction: "Execute",
    shootHeading: "Order 66",
    shootInstruction: "Select a player to execute.",
    shootConfirm: "Execute",
    specialBadMarker: "(Palpatine)",
    badTeamHeading: "Your Allies",
    badTeamDescription:
      "These players are Sith. One of them is Palpatine \u2014 they raised their thumb but kept their eyes closed.",
    goodTeamMessage:
      "Close your eyes and wait. The Sith are identifying each other.",
    specialBadMessage:
      "Close your eyes and raise your thumb. The other Sith will see you.",
    specialBadAllyDescription: "This player is a Sith Lord.",
    voteYes: "Yes",
    voteNo: "No",
  },
  [SvTheme.Business]: {
    name: "Business",
    goodTeam: "Employee",
    badTeam: "Hustle",
    goodRole: "Employee",
    badRole: "Snitch",
    specialBadRole: "The Boss",
    goodPolicy: "Workplace Perk",
    badPolicy: "Unpaid Overtime",
    goodTrack: "Workplace Perks",
    badTrack: "Unpaid Overtime",
    goodWins: "Employees Win!",
    badWins: "Management Wins!",
    shootAction: "Fire",
    shootHeading: "Termination",
    shootInstruction: "Select a player to fire.",
    shootConfirm: "Fire",
    specialBadMarker: "(The Boss)",
    badTeamHeading: "Your Allies",
    badTeamDescription:
      "These players are in on the Hustle. One of them is The Boss \u2014 they raised their thumb but kept their eyes closed.",
    goodTeamMessage:
      "Close your eyes and wait. Management is identifying each other.",
    specialBadMessage:
      "Close your eyes and raise your thumb. The other Management players will see you.",
    specialBadAllyDescription: "This player is on the Management team.",
    voteYes: "Sure",
    voteNo: "Wait",
  },
};

/** Returns the theme labels for the given theme ID, falling back to Default. */
export function getSvThemeLabels(theme?: SvTheme): SvThemeLabels {
  return SV_THEMES[theme ?? SvTheme.Default];
}
