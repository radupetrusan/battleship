import { HitType } from './hit-type';

export class HitPoint {
    i: number;
    j: number;
    hitType: HitType;
    weight: number;

    constructor(init?: Partial<HitPoint>) {
        Object.assign(this, init);
    }
}