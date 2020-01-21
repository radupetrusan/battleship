import { ActionType } from './action-type';
import { HitPoint } from './hit-point';
import { Ship } from './ship';

export class GameMessage {
    id: string;
    messageType: ActionType;
    hitPoint: HitPoint;
    destination: string;
    destroyedShip: Ship;
    unread: boolean;

    constructor(init?: Partial<GameMessage>) {
        this.unread = true;
        Object.assign(this, init);
    }
}
