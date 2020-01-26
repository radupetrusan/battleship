import { GameBot } from './game-bot';
import { HitPoint } from '../shared/models';
import { GameService } from '../core/services';
import { getRandom } from '../shared/utils/math-operations';
import { GameMessage } from '../shared/models/game-message';

export class RandomBot implements GameBot {

    boardPoints: HitPoint[];

    constructor(private gameService: GameService) {
        this.initBoardPoints();
    }

    processResponse(message: GameMessage) {
        throw new Error('Method not implemented.');
    }

    shoot(): HitPoint {
        let availablePoints = [...this.boardPoints];
        availablePoints = availablePoints
            .filter(h => !this.gameService.currentGame.enemyDestroyedPoints.find(hh => h.i === hh.i && h.j === hh.j));

        availablePoints = availablePoints
            .filter(h => !this.gameService.currentGame.enemyHitPoints.find(hh => h.i === hh.i && h.j === hh.j));

        availablePoints = availablePoints
            .filter(h => !this.gameService.currentGame.enemyMissedPoints.find(hh => h.i === hh.i && h.j === hh.j));

        const i = getRandom(availablePoints.length - 1);
        return availablePoints[i];
    }

    private initBoardPoints() {
        this.boardPoints = [];

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                this.boardPoints.push(new HitPoint({ i, j }));
            }
        }
    }
}
