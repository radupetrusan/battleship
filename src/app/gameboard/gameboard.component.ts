import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Ship, HitPoint } from '../shared/models';

@Component({
  selector: 'app-gameboard',
  templateUrl: './gameboard.component.html',
  styleUrls: ['./gameboard.component.scss']
})
export class GameboardComponent implements OnInit {

  @Input() boardSize = 10;
  @Input() boardMode = 'init';
  @Input() personalShips: Ship[];
  @Input() hitPoints: HitPoint[];

  @Input() shipToPlace: Ship;

  @Output() shipPlaced = new EventEmitter<Ship>();

  selectionPoints: HitPoint[] = [];
  personalPoints: HitPoint[] = [];

  constructor() { }

  ngOnInit() {
  }

  onHover(i, j) {
    this.selectionPoints = [];
    if (!!this.shipToPlace) {
      if (this.shipToPlace.vertical && this.shipToPlace.size + i > this.boardSize) {
        return;
      }
      if (!this.shipToPlace.vertical && this.shipToPlace.size + j > this.boardSize) {
        return;
      }

      for (let index = 0; index < this.shipToPlace.size; index++) {
        if (this.shipToPlace.vertical) {
          this.selectionPoints.push(new HitPoint({ i: i + index, j }));
        } else {
          this.selectionPoints.push(new HitPoint({ i, j: j + index }));
        }
      }

      this.selectionPoints.forEach(p => {
        if (!!this.personalPoints.find(pp => pp.i === p.i && pp.j === p.j)) {
          this.selectionPoints = [];
          return;
        }
      });
    }

  }

  onClick(i: number, j: number) {
    switch (this.boardMode) {
      case 'init': {
        if (!!this.selectionPoints && this.selectionPoints.length) {
          const ship = new Ship({
            size: this.selectionPoints.length,
            hitPoints: this.selectionPoints,
            vertical: this.shipToPlace.vertical
          });

          this.personalPoints = [...this.personalPoints, ...this.selectionPoints];
          this.shipPlaced.emit(ship);
          this.selectionPoints = [];
        }
      }
    }
  }

  pointStatus(i, j) {
    switch (this.boardMode) {
      case 'init': {
        const point = this.personalPoints.find(p => p.i === i && p.j === j);
        if (!!point) {
          return 'placed';
        }

        if (!!this.selectionPoints.find(e => e.i === i && e.j === j)) {
          return 'selected';
        }
      }
    }
  }

}
