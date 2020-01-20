import { Injectable } from '@angular/core';
import { Ship } from 'src/app/shared/models';

@Injectable({
  providedIn: 'root'
})
export class ShipsService {

  constructor() { }

  initShips() {
    const ships = [
      new Ship({ size: 2, vertical: true }),
      new Ship({ size: 3, vertical: true }),
      new Ship({ size: 3, vertical: true }),
      new Ship({ size: 4, vertical: true }),
      new Ship({ size: 5, vertical: true })
    ];

    return ships;
  }

}
