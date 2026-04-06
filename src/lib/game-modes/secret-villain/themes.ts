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
  },
};

/** Returns the theme labels for the given theme ID, falling back to Default. */
export function getSvThemeLabels(theme?: SvTheme): SvThemeLabels {
  return SV_THEMES[theme ?? SvTheme.Default];
}
