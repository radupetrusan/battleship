export class HitPoint {
    i: number;
    j: number;
    hit: boolean;

    constructor(init?: Partial<HitPoint>) {
        Object.assign(this, init);
    }
}