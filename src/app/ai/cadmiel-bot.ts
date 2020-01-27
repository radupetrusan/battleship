import { GameBot } from './game-bot';
import { HitPoint } from '../shared/models';
import { GameService } from '../core/services';
import { GameMessage } from '../shared/models/game-message';
import { HitType } from '../shared/models/hit-type';
import { ActionType } from '../shared/models/action-type';

export class CadmielBot implements GameBot {

    SHIP = 0;
    MISS = 1;
    HIT = 2;
    hitsMade;
    hitsToWin;

    ships = [5, 4, 3, 3, 2];
    // TODO: look into Int8Array on these big matrices for performance
    positions = [];
    probabilities = [];
    hitsSkewProbabilities = true;
    skewFactor = 3;
    boardSize = 10;
    volleyButton

    constructor(private gameService: GameService) {
        this.setupBoard();
    }

    processResponse(message: GameMessage) {

        if (message.messageType === ActionType.Attack) {
            return;
        }

        let x = message.hitPoint.i,
            y = message.hitPoint.j;


        if (!!message.destroyedShip && !!message.destroyedShip.hitPoints && message.destroyedShip.hitPoints.length) {
            // Barca e scufundata
            this.positions[x][y] = this.HIT;
            this.hitsMade++;
        } else {
            if (message.hitPoint.hitType === HitType.Hit) {
                this.positions[x][y] = this.HIT;
                this.hitsMade++;
            } else {
                this.positions[x][y] = this.MISS;
            }
        }

        this.recalculateProbabilities();
    }

    shoot(): HitPoint {
        var pos = this.getBestUnplayedPosition()

        return new HitPoint(pos);
    }


    setupBoard() {

        // initialize positions matrix
        for (var y = 0; y < this.boardSize; y++) {
            this.positions[y] = [];
            this.probabilities[y] = [];
            for (var x = 0; x < this.boardSize; x++) {
                this.positions[y][x] = 0;
                this.probabilities[y][x] = 0;
            }
        }

        // determine hits to win given the set of ships
        this.hitsMade = this.hitsToWin = 0;
        for (var i = 0, l = this.ships.length; i < l; i++) {
            this.hitsToWin += this.ships[i];
        }

        //this.recalculateProbabilities();
    }

    recalculateProbabilities() {
        var hits = [];

        // reset probabilities
        for (var y = 0; y < this.boardSize; y++) {
            this.probabilities[y] = [];
            for (var x = 0; x < this.boardSize; x++) {
                this.probabilities[y][x] = 0;
                // we remember hits as we find them for skewing
                if (this.hitsSkewProbabilities && this.positions[x][y] === this.HIT) {
                    hits.push([x, y]);
                }
            }
        }

        // calculate probabilities for each type of ship
        for (var i = 0, l = this.ships.length; i < l; i++) {
            for (var y = 0; y < this.boardSize; y++) {
                for (var x = 0; x < this.boardSize; x++) {
                    // horizontal check
                    if (this.shipCanOccupyPosition(this.MISS, [x, y], this.ships[i], false)) {
                        this.increaseProbability([x, y], this.ships[i], false);
                    }
                    // vertical check
                    if (this.shipCanOccupyPosition(this.MISS, [x, y], this.ships[i], true)) {
                        this.increaseProbability([x, y], this.ships[i], true);
                    }
                }
            }
        }

        // skew probabilities for positions adjacent to hits
        if (this.hitsSkewProbabilities) {
            this.skewProbabilityAroundHits(hits);
        }
    }

    increaseProbability(pos, shipSize, vertical) {
        // "pos" is ship origin
        var x = pos[0],
            y = pos[1],
            z = (vertical ? y : x),
            end = z + shipSize - 1;

        for (var i = z; i <= end; i++) {
            if (vertical) this.probabilities[x][i]++;
            else this.probabilities[i][y]++;
        }
    }

    skewProbabilityAroundHits(toSkew) {
        var uniques = [];

        // add adjacent positions to the positions to be skewed
        for (var i = 0, l = toSkew.length; i < l; i++) {
            toSkew = toSkew.concat(this.getAdjacentPositions(toSkew[i]));
        }

        // store uniques to avoid skewing positions multiple times
        // TODO: do A/B testing to see if doing this with strings is efficient
        for (var i = 0, l = toSkew.length; i < l; i++) {
            var uniquesStr = uniques.join('|').toString();
            if (uniquesStr.indexOf(toSkew[i].toString()) === -1) {
                uniques.push(toSkew[i]);

                // skew probability
                var x = toSkew[i][0],
                    y = toSkew[i][1];
                this.probabilities[x][y] *= this.skewFactor;
            }
        }
    }

    getAdjacentPositions(pos) {
        var x = pos[0],
            y = pos[1],
            adj = [];

        if (y + 1 < this.boardSize) adj.push([x, y + 1]);
        if (y - 1 >= 0) adj.push([x, y - 1]);
        if (x + 1 < this.boardSize) adj.push([x + 1, y]);
        if (x - 1 >= 0) adj.push([x - 1, y]);

        return adj;
    }

    shipCanOccupyPosition(criteriaForRejection, pos, shipSize, vertical) { // TODO: criteriaForRejection is an awkward concept, improve
        // "pos" is ship origin
        var x = pos[0],
            y = pos[1],
            z = (vertical ? y : x),
            end = z + shipSize - 1;

        // board border is too close
        if (end > this.boardSize - 1) return false;

        // check if there's an obstacle
        for (var i = z; i <= end; i++) {
            var thisPos = (vertical ? this.positions[x][i] : this.positions[i][y]);
            if (thisPos === criteriaForRejection) return false;
        }

        return true;
    }


    getBestUnplayedPosition() {
        var bestProb = 0,
            bestPos = this.getRandomPosition();

        // so far there is no tie-breaker -- first position
        // with highest probability on board is returned
        for (var y = 0; y < this.boardSize; y++) {
            for (var x = 0; x < this.boardSize; x++) {
                if (!this.positions[x][y] && this.probabilities[x][y] > bestProb) {
                    bestProb = this.probabilities[x][y];
                    bestPos = new HitPoint({ i: x, j: y });
                }
            }
        }

        return bestPos;
    }

    getRandomPosition() {
        var x = Math.floor(Math.random() * 9),
            y = Math.floor(Math.random() * 9);

        return new HitPoint({ i: x, j: y });
    }

    randomBoolean() {
        return (Math.round(Math.random()) == 1);
    }
}