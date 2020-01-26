import { Injectable } from '@angular/core';
import { Ship } from 'src/app/shared/models';

const ships = [
  new Ship({ size: 2, vertical: true }),
  new Ship({ size: 3, vertical: true }),
  new Ship({ size: 3, vertical: true }),
  new Ship({ size: 4, vertical: true }),
  new Ship({ size: 5, vertical: true })
];

@Injectable({
  providedIn: 'root'
})
export class ShipsService {

  constructor() { }

  static initShipsStatic() {
    return ships;
  }

  initShips() {
    return ships;
  }

}
