import { GameBot } from './game-bot';
import { HitPoint } from '../shared/models';
import { GameService } from '../core/services';

export class CadmielBot implements GameBot {

    constructor(private gameService: GameService) {

    }

    shoot(): HitPoint {
        return;
    }
}
