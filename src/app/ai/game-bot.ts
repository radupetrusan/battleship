import { HitPoint } from '../shared/models';
import { GameMessage } from '../shared/models/game-message';

export interface GameBot {
    shoot(): HitPoint; // based on current game, bot should return a hit point where it wants to shoot
    processResponse(message: GameMessage);
}
