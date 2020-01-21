import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Ship, HitPoint } from '../shared/models';
import { GameMessage } from '../shared/models/game-message';
import { HitType } from '../shared/models/hit-type';
import { ActionType } from '../shared/models/action-type';
import { GameService } from '../core/services';

@Component({
  selector: 'app-gameboard',
  templateUrl: './gameboard.component.html',
  styleUrls: ['./gameboard.component.scss']
})
export class GameboardComponent implements OnInit {

  @Input() boardSize = 10;
  @Input() boardMode = 'init';
  @Input() personalShips: Ship[];
  @Input() shipToPlace: Ship;

  @Output() shipPlaced = new EventEmitter<Ship>();

  selectionPoints: HitPoint[] = [];
  personalPoints: HitPoint[] = [];

  constructor(
    private gameService: GameService
  ) { }

  ngOnInit() {
    this.initBoard();
  }

  onHover(i, j) {
    this.selectionPoints = [];
    switch (this.boardMode) {
      case 'init':
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
        break;

      case 'attack': {
        this.selectionPoints.push(new HitPoint({ i, j }));
      }

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

        break;
      }

      case 'attack': {
        if (!this.gameService.yourTurn) {
          return;
        }
        this.gameService.yourTurn = false;
        const message = new GameMessage({
          hitPoint: new HitPoint({ i, j }),
          messageType: ActionType.Attack,
          destination: this.gameService.currentGameOwner ? 'guest' : 'owner'
        });

        this.gameService.sendMessage(message);
        break;
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

        break;
      }

      case 'attack': {
        if (this.gameService.yourTurn && !!this.selectionPoints.find(e => e.i === i && e.j === j)) {
          return 'selected';
        }

        if (!this.gameService.currentGame) {
          return;
        }

        if (!!this.gameService.currentGame.enemyMissedPoints &&
          !!this.gameService.currentGame.enemyMissedPoints.find(e => e.i === i && e.j === j)) {
          return 'missed';
        }

        if (!!this.gameService.currentGame.enemyHitPoints &&
          !!this.gameService.currentGame.enemyHitPoints.find(e => e.i === i && e.j === j)) {
          return 'hit';
        }

        if (!!this.gameService.currentGame.enemyDestroyedPoints &&
          !!this.gameService.currentGame.enemyDestroyedPoints.find(e => e.i === i && e.j === j)) {
          return 'destroyed';
        }

        break;
      }

      case 'defend': {
        if (!!this.personalPoints.find(p => p.i === i && p.j === j)) {
          return 'placed';
        }

        if (!this.gameService.currentGame) {
          return;
        }

        if (!!this.gameService.currentGame.personalMissedPoints &&
          !!this.gameService.currentGame.personalMissedPoints.find(e => e.i === i && e.j === j)) {
          return 'missed';
        }

        if (!!this.gameService.currentGame.personalHitPoints &&
          !!this.gameService.currentGame.personalHitPoints.find(e => e.i === i && e.j === j)) {
          return 'hit';
        }

        if (!!this.gameService.currentGame.personalDestroyedPoints &&
          !!this.gameService.currentGame.personalDestroyedPoints.find(e => e.i === i && e.j === j)) {
          return 'destroyed';
        }
      }
    }
  }

  private initBoard() {
    if (!!this.personalShips) {
      this.personalShips.forEach(s => this.personalPoints = [...this.personalPoints, ...s.hitPoints]);
    }
  }

}
