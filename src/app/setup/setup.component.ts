import { Component, OnInit, ViewChild } from '@angular/core';
import { ShipsService, GameService } from '../core/services';
import { Ship, HitPoint } from '../shared/models';
import { Game } from '../shared/models/game';
import { Router } from '@angular/router';
import { GameboardComponent } from '../gameboard/gameboard.component';
import { getRandom } from '../shared/utils/math-operations';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  @ViewChild('gameboard', { static: false }) gameboard: GameboardComponent;

  remainingShips: Ship[] = [];
  selectedShip: Ship;
  placedShips: Ship[] = [];

  vertical = true;

  get joinMode() {
    return !!this.gameService.currentGameId;
  }

  constructor(
    private shipsSerivce: ShipsService,
    private gameService: GameService,
    private router: Router
  ) { }

  ngOnInit() {
    this.initShips();
  }

  rotateShips() {
    this.vertical = !this.vertical;
    this.remainingShips.forEach(s => s.vertical = this.vertical);
    if (!!this.selectedShip) {
      this.selectedShip.vertical = this.vertical;
    }
  }

  selectShip(ship: Ship) {
    if (!!this.selectedShip) {
      this.remainingShips.push(this.selectedShip);
    }

    this.selectedShip = ship;
    this.remainingShips = this.remainingShips.filter(s => s !== ship);
  }

  unselectShip() {
    this.remainingShips.push(this.selectedShip);
    this.selectedShip = null;
  }

  shipPlaced(ship: Ship) {
    this.selectedShip = null;
    this.placedShips.push(ship);
  }

  createGame(gameAlgorythm: string) {
    let totalPoints = 0;
    this.placedShips.forEach(s => {
      totalPoints += s.hitPoints.length;
    });

    const game = new Game({ totalPoints });
    this.gameService.createGame(game, [...this.placedShips], gameAlgorythm)
      .then(g => {
        this.router.navigate(['/game']);
      });
  }

  joinGame(gameAlgorythm: string) {
    this.gameService.placeShips([...this.placedShips], gameAlgorythm);
    this.router.navigate(['/game']);
  }

  randomize() {
    this.clearShips();

    while (!!this.remainingShips.length) {
      const orientation = getRandom(100); // 0 - horizontal, 1 - vertical
      const vertical = orientation > 50;

      const ship = this.remainingShips[0];
      const shipLength = ship.size;

      const points = [] as HitPoint[];
      let i = 0;
      let j = 0;

      if (vertical) {
        // Vertical
        i = getRandom(10 - shipLength);
        j = getRandom(10);
        for (let index = 0; index < shipLength; index++) {
          points.push(new HitPoint({ i: i + index, j }));
        }
      } else {
        // Horizontal
        i = getRandom(10);
        j = getRandom(10 - shipLength);
        for (let index = 0; index < shipLength; index++) {
          points.push(new HitPoint({ i, j: j + index }));
        }
      }

      if (!this.gameboard.shipIntersected(points)) {
        this.selectedShip = ship;
        this.selectedShip.hitPoints = [...points];
        this.selectedShip.vertical = vertical;
        this.remainingShips = this.remainingShips.filter(s => s !== ship);
        this.gameboard.selectionPoints = [...points];
        this.gameboard.placeShip(this.selectedShip, i, j);

      }
    }

    this.gameboard.selectionPoints = [];
  }

  clearShips() {
    this.placedShips = [];
    this.remainingShips = this.shipsSerivce.initShips();
    if (!!this.gameboard) {
      this.gameboard.clear();
    }
  }

  private initShips() {
    this.remainingShips = this.shipsSerivce.initShips();
  }

}
