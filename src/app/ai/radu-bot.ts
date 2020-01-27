import { GameBot } from './game-bot';
import { HitPoint, Ship } from '../shared/models';
import { GameService, ShipsService } from '../core/services';
import { getRandomFromInterval } from '../shared/utils/math-operations';
import { GameMessage } from '../shared/models/game-message';
import { ActionType } from '../shared/models/action-type';
import { HitType } from '../shared/models/hit-type';

const gameSize = 10;

const TYPE_EMPTY = 0; // 0 = water (empty)
const TYPE_SHIP = 1; // 1 = undamaged ship
const TYPE_MISS = 2; // 2 = water with a cannonball in it (missed shot)
const TYPE_HIT = 3; // 3 = damaged ship (hit shot)
const TYPE_SUNK = 4; // 4 = sunk ship

const DIRECTION_VERTICAL = 0;
const DIRECTION_HORIZONTAL = 1;

export class RaduBot implements GameBot {
    probGrid: number[][];

    virtualGrid: Grid;
    virtualFleet: Fleet;

    PROB_WEIGHT = 5000;
    OPEN_HIGH_MIN = 20;
    OPEN_HIGH_MAX = 30;
    // how much weight to give to the opening book's medium probability cells
    OPEN_MED_MIN = 15;
    OPEN_MED_MAX = 25;
    // how much weight to give to the opening book's low probability cells
    OPEN_LOW_MIN = 10;
    OPEN_LOW_MAX = 20;
    // Amount of randomness when selecting between cells of equal probability
    RANDOMNESS = 0.1;
    // AI's opening book.
    // This is the pattern of the first cells for the AI to target
    OPENINGS = [
        new HitPoint({ i: 7, j: 3, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 6, j: 2, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 3, j: 7, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 2, j: 6, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 6, j: 6, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 3, j: 3, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 5, j: 5, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 4, j: 4, weight: getRandomFromInterval(this.OPEN_LOW_MIN, this.OPEN_LOW_MAX) }),
        new HitPoint({ i: 0, j: 8, weight: getRandomFromInterval(this.OPEN_MED_MIN, this.OPEN_MED_MAX) }),
        new HitPoint({ i: 1, j: 9, weight: getRandomFromInterval(this.OPEN_HIGH_MIN, this.OPEN_HIGH_MAX) }),
        new HitPoint({ i: 8, j: 0, weight: getRandomFromInterval(this.OPEN_MED_MIN, this.OPEN_MED_MAX) }),
        new HitPoint({ i: 9, j: 1, weight: getRandomFromInterval(this.OPEN_HIGH_MIN, this.OPEN_HIGH_MAX) }),
        new HitPoint({ i: 9, j: 9, weight: getRandomFromInterval(this.OPEN_HIGH_MIN, this.OPEN_HIGH_MAX) }),
        new HitPoint({ i: 0, j: 0, weight: getRandomFromInterval(this.OPEN_HIGH_MIN, this.OPEN_HIGH_MAX) })
    ];

    constructor() {
        this.virtualGrid = new Grid(gameSize);
        this.virtualFleet = new Fleet(this.virtualGrid);

        this.initProbs();
    }

    shoot(): HitPoint {
        // const i = getRandom(9);
        // const j = getRandom(9);
        // return new HitPoint({ i, j });

        console.log('Probabilities Grid before shooting:');
        console.table(this.probGrid);

        let maxProbability = 0;
        let maxProbCoords: HitPoint = null;
        let maxProbs: HitPoint[] = [];

        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < this.OPENINGS.length; i++) {
            const cell = this.OPENINGS[i];
            if (this.probGrid[cell.i][cell.j] !== 0) {
                this.probGrid[cell.i][cell.j] += cell.weight;
            }
        }

        for (let i = 0; i < gameSize; i++) {
            for (let j = 0; j < gameSize; j++) {
                if (this.probGrid[i][j] > maxProbability) {
                    maxProbability = this.probGrid[i][j];
                    maxProbs = [new HitPoint({ i, j })];
                } else if (this.probGrid[i][j] === maxProbability) {
                    maxProbs.push(new HitPoint({ i, j }));
                }
            }
        }

        maxProbCoords = Math.random() < this.RANDOMNESS ? maxProbs[Math.floor(Math.random() * maxProbs.length)] : maxProbs[0];

        return new HitPoint({ i: maxProbCoords.i, j: maxProbCoords.j });

        return null;
    }

    processResponse(message: GameMessage) {
        if (message.messageType === ActionType.Attack) {
            return;
        }

        if (!!message.destroyedShip && !!message.destroyedShip.hitPoints && message.destroyedShip.hitPoints.length) {
            // this.virtualGrid.cells[message.hitPoint.i][message.hitPoint.j] = TYPE_SUNK;
            message.destroyedShip.hitPoints.forEach(p => {
                this.virtualGrid.cells[p.i][p.j] = TYPE_SUNK;
            });
            const ship = this.virtualFleet.fleetRoster.find(s => s.size === message.destroyedShip.size);
            this.virtualFleet.fleetRoster = this.virtualFleet.fleetRoster.filter(s => s !== ship);
        } else {
            if (message.hitPoint.hitType === HitType.Hit) {
                this.virtualGrid.cells[message.hitPoint.i][message.hitPoint.j] = TYPE_HIT;
            } else {
                this.virtualGrid.cells[message.hitPoint.i][message.hitPoint.j] = TYPE_MISS;
            }
        }

        this.updateProbs();
    }

    private initProbs() {
        this.probGrid = [];
        for (let i = 0; i < gameSize; i++) {
            const row = [] as number[];
            this.probGrid[i] = row;

            for (let j = 0; j < gameSize; j++) {
                row.push(0);
            }
        }
    }

    private resetProbs() {
        for (let i = 0; i < gameSize; i++) {
            for (let j = 0; j < gameSize; j++) {
                this.probGrid[i][j] = 0;
            }
        }
    }

    private updateProbs() {
        const roster: Ship[] = this.virtualFleet.fleetRoster; // TO DO: get this from virtual fleet
        let coords: HitPoint[];
        this.resetProbs();

        // tslint:disable-next-line: prefer-for-of
        for (let k = 0; k < roster.length; k++) {
            for (let x = 0; x < gameSize; x++) {
                for (let y = 0; y < gameSize; y++) {
                    // if (roster[k].isLegal(x, y, DIRECTION_VERTICAL)) {
                    if (this.shipIsLegal(x, y, DIRECTION_VERTICAL, this.virtualGrid, roster[k].size)) {
                        const ship = this.createVirtualShip(x, y, DIRECTION_VERTICAL, roster[k].size);
                        // roster[k].create(x, y, DIRECTION_VERTICAL, true);
                        // coords = roster[k].getAllShipCells();
                        coords = ship.hitPoints;
                        if (this.passesThroughHitCell(coords)) {
                            // tslint:disable-next-line: prefer-for-of
                            for (let i = 0; i < coords.length; i++) {
                                this.probGrid[coords[i].i][coords[i].j] += this.PROB_WEIGHT * this.numHitCellsCovered(coords);
                            }
                        } else {
                            // tslint:disable-next-line: prefer-for-of
                            for (let ii = 0; ii < coords.length; ii++) {
                                this.probGrid[coords[ii].i][coords[ii].j]++;
                            }
                        }
                    }
                    // if (roster[k].isLegal(x, y, DIRECTION_HORIZONTAL)) {
                    if (this.shipIsLegal(x, y, DIRECTION_HORIZONTAL, this.virtualGrid, roster[k].size)) {
                        // roster[k].create(x, y, DIRECTION_HORIZONTAL, true);
                        // coords = roster[k].getAllShipCells();
                        const ship = this.createVirtualShip(x, y, DIRECTION_HORIZONTAL, roster[k].size);
                        coords = ship.hitPoints;
                        if (this.passesThroughHitCell(coords)) {
                            // tslint:disable-next-line: prefer-for-of
                            for (let j = 0; j < coords.length; j++) {
                                this.probGrid[coords[j].i][coords[j].j] += this.PROB_WEIGHT * this.numHitCellsCovered(coords);
                            }
                        } else {
                            // tslint:disable-next-line: prefer-for-of
                            for (let jj = 0; jj < coords.length; jj++) {
                                this.probGrid[coords[jj].i][coords[jj].j]++;
                            }
                        }
                    }

                    // Set hit cells to probability zero so the AI doesn't
                    // target cells that are already hit
                    if (this.virtualGrid.cells[x][y] === TYPE_HIT) {
                        this.probGrid[x][y] = 0;
                    }
                }
            }
        }
    }

    private numHitCellsCovered(shipCells: HitPoint[]) {
        let cells = 0;
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < shipCells.length; i++) {
            if (this.virtualGrid.cells[shipCells[i].i][shipCells[i].j] === TYPE_HIT) {
                cells++;
            }
        }
        return cells;
    }

    private passesThroughHitCell(shipCells: HitPoint[]) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < shipCells.length; i++) {
            if (this.virtualGrid.cells[shipCells[i].i][shipCells[i].j] === TYPE_HIT) {
                return true;
            }
        }
        return false;
    }

    private shipIsLegal(x, y, direction, grid: Grid, shipLength: number) {
        // first, check if the ship is within the grid...
        if (this.shipWithinBounds(x, y, direction, shipLength)) {
            // ...then check to make sure it doesn't collide with another ship
            for (let i = 0; i < shipLength; i++) {
                if (direction === DIRECTION_VERTICAL) {
                    if (grid.cells[x + i][y] === TYPE_SHIP ||
                        grid.cells[x + i][y] === TYPE_MISS ||
                        grid.cells[x + i][y] === TYPE_SUNK) {
                        return false;
                    }
                } else {
                    if (grid.cells[x][y + i] === TYPE_SHIP ||
                        grid.cells[x][y + i] === TYPE_MISS ||
                        grid.cells[x][y + i] === TYPE_SUNK) {
                        return false;
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    }

    private shipWithinBounds(x, y, direction, shipLength: number) {
        if (direction === DIRECTION_VERTICAL) {
            return x + shipLength <= gameSize;
        } else {
            return y + shipLength <= gameSize;
        }
    }

    private createVirtualShip(x, y, direction: number, shipLength: number) {
        const ship = new Ship({ size: shipLength, hitPoints: [], vertical: !!direction });

        if (direction === DIRECTION_VERTICAL) {
            for (let i = 0; i < shipLength; i++) {
                ship.hitPoints.push(new HitPoint({ i: x + i, j: y }));
            }
        } else {
            for (let i = 0; i < shipLength; i++) {
                ship.hitPoints.push(new HitPoint({ i: x, j: y + i }));
            }
        }

        return ship;
    }
}

class Grid {
    size: number;
    cells: number[][];

    constructor(size) {
        this.size = size;
        this.cells = [];

        for (let i = 0; i < this.size; i++) {
            const row = [];
            this.cells[i] = row;

            for (let j = 0; j < this.size; j++) {
                row.push(TYPE_EMPTY);
            }
        }
    }
}

class Fleet {
    // numShips: number;
    playerGrid: Grid;
    fleetRoster: Ship[];

    constructor(grid: Grid) {
        this.playerGrid = grid;

        this.fleetRoster = ShipsService.initShipsStatic();
    }
}
