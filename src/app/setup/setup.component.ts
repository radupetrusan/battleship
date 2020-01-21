import { Component, OnInit } from '@angular/core';
import { ShipsService, GameService } from '../core/services';
import { Ship, HitPoint } from '../shared/models';
import { Game } from '../shared/models/game';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

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

  createGame() {
    const game = new Game();
    this.gameService.createGame(game, [...this.placedShips]).then(g => {
      this.router.navigate(['/game']);
    });
  }

  joinGame() {
    this.gameService.placeShips([...this.placedShips]);
    this.router.navigate(['/game']);
  }

  private initShips() {
    this.remainingShips = this.shipsSerivce.initShips();
  }

}
