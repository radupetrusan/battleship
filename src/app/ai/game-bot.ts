import { HitPoint } from '../shared/models';

export interface GameBot {
    shoot(): HitPoint; // based on current game, bot should return a hit point where it wants to shoot
}
