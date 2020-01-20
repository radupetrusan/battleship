import { HitPoint } from './hit-point';

export class Ship {
    size: number;
    vertical: boolean;
    hitPoints: HitPoint[];
    destroyed: boolean;

    constructor(init?: Partial<Ship>) {
        Object.assign(this, init);
    }
}
