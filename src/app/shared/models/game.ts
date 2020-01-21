import { GameMessage } from './game-message';
import { HitPoint } from './hit-point';

export class Game {
    id: string;
    messages: GameMessage[];
    turn: string;

    personalMissedPoints: HitPoint[];
    personalHitPoints: HitPoint[];
    personalDestroyedPoints: HitPoint[];

    enemyMissedPoints: HitPoint[];
    enemyHitPoints: HitPoint[];
    enemyDestroyedPoints: HitPoint[];

    totalPoints: number;

    constructor(init?: Partial<Game>) {
        // this.personalDestroyedPoints = [];
        // this.personalHitPoints = [];
        // this.personalMissedPoints = [];

        // this.enemyDestroyedPoints = [];
        // this.enemyHitPoints = [];
        // this.enemyMissedPoints = [];

        Object.assign(this, init);
    }
}
