import { GameBot } from './game-bot';
import { HitPoint } from '../shared/models';
import { GameService } from '../core/services';
import { getRandom } from '../shared/utils/math-operations';

export class RaduBot implements GameBot {

    constructor(private gameService: GameService) {

    }

    shoot(): HitPoint {
        const i = getRandom(9);
        const j = getRandom(9);
        return new HitPoint({ i, j });
    }
}
