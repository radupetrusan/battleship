import { Component, OnInit } from '@angular/core';
import { ShipsService } from '../core/services';
import { Ship, HitPoint } from '../shared/models';

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

  constructor(private shipsSerivce: ShipsService) { }

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

  shipPlaced(ship: Ship) {
    this.selectedShip = null;
    this.placedShips.push(ship);
  }

  private initShips() {
    this.remainingShips = this.shipsSerivce.initShips();
  }

}
