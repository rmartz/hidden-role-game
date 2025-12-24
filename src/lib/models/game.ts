export interface Player {
    id: string;
    name: string;
}

export interface Game {
    id: string;
    players: Player[];
}
