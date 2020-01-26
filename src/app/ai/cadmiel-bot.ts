import { GameBot } from './game-bot';
import { HitPoint } from '../shared/models';
import { GameService } from '../core/services';
import { GameMessage } from '../shared/models/game-message';

export class CadmielBot implements GameBot {

    constructor(private gameService: GameService) {

    }

    processResponse(message: GameMessage) {
        throw new Error('Method not implemented.');
    }

    shoot(): HitPoint {
        return;
    }
}
