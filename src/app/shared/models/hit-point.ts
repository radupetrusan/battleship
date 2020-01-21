import { HitType } from './hit-type';

export class HitPoint {
    i: number;
    j: number;
    hitType: HitType;

    constructor(init?: Partial<HitPoint>) {
        Object.assign(this, init);
    }
}