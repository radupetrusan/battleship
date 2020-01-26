import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Ship, HitPoint } from '../shared/models';
import { GameMessage } from '../shared/models/game-message';
import { ActionType } from '../shared/models/action-type';
import { GameService } from '../core/services';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';
import { GameBot, RaduBot, CadmielBot, RandomBot } from '../ai';

@Component({
  selector: 'app-gameboard',
  templateUrl: './gameboard.component.html',
  styleUrls: ['./gameboard.component.scss']
})
export class GameboardComponent implements OnInit, OnDestroy {

  @Input() boardSize = 10;
  @Input() boardMode = 'init';
  @Input() personalShips: Ship[];
  @Input() shipToPlace: Ship;

  @Output() shipPlaced = new EventEmitter<Ship>();

  selectionPoints: HitPoint[] = [];
  personalPoints: HitPoint[] = [];

  private destroy$ = new ReplaySubject<boolean>(null);

  private gameBot: GameBot;

  constructor(
    private gameService: GameService
  ) { }

  ngOnInit() {
    this.initBoard();
    this.subscribeToYourTurn();

    switch (this.gameService.currentGameAlgorythm) {
      case 'radu':
        this.gameBot = new RaduBot(this.gameService);
        break;
      case 'cadmiel':
        this.gameBot = new CadmielBot(this.gameService);
        break;
      case 'random':
        this.gameBot = new RandomBot(this.gameService);
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
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

          if (this.shipIntersected(this.selectionPoints)) {
            this.selectionPoints = [];
          }

          // this.selectionPoints.forEach(p => {
          //   if (!!this.personalPoints.find(pp => pp.i === p.i && pp.j === p.j)) {
          //     this.selectionPoints = [];
          //     return;
          //   }
          // });
        }
        break;

      case 'attack': {
        if (!!this.gameService.currentGame) {
          if (this.pointIsFound(this.gameService.currentGame.enemyDestroyedPoints, i, j)) {
            return;
          }

          if (this.pointIsFound(this.gameService.currentGame.enemyHitPoints, i, j)) {
            return;
          }

          if (this.pointIsFound(this.gameService.currentGame.enemyMissedPoints, i, j)) {
            return;
          }
        }
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

        if (!!this.gameService.currentGame) {
          if (this.pointIsFound(this.gameService.currentGame.enemyDestroyedPoints, i, j)) {
            return;
          }

          if (this.pointIsFound(this.gameService.currentGame.enemyHitPoints, i, j)) {
            return;
          }

          if (this.pointIsFound(this.gameService.currentGame.enemyMissedPoints, i, j)) {
            return;
          }
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

  placeShip(ship: Ship, i: number, j: number) {
    this.shipToPlace = ship;
    this.onClick(i, j);
    this.selectionPoints = [];
  }

  pointStatus(i, j) {
    switch (this.boardMode) {
      case 'init': {

        if (this.pointIsFound(this.personalPoints, i, j)) {
          return 'placed';
        }

        if (this.pointIsFound(this.selectionPoints, i, j)) {
          return 'selected';
        }

        break;
      }

      case 'attack': {
        if (this.gameService.yourTurn && this.pointIsFound(this.selectionPoints, i, j)) {
          return 'selected';
        }

        if (!this.gameService.currentGame) {
          return;
        }

        if (this.pointIsFound(this.gameService.currentGame.enemyDestroyedPoints, i, j)) {
          return 'destroyed animated';
        }

        if (this.pointIsFound(this.gameService.currentGame.enemyHitPoints, i, j)) {
          return 'hit';
        }

        if (this.pointIsFound(this.gameService.currentGame.enemyMissedPoints, i, j)) {
          return 'missed';
        }

        break;
      }

      case 'defend': {

        if (!this.gameService.currentGame) {
          if (this.pointIsFound(this.personalPoints, i, j)) {
            return 'placed';
          }

          return;
        }

        if (this.pointIsFound(this.gameService.currentGame.personalDestroyedPoints, i, j)) {
          return 'destroyed animated';
        }

        if (this.pointIsFound(this.gameService.currentGame.personalHitPoints, i, j)) {
          return 'hit animated';
        }

        if (this.pointIsFound(this.gameService.currentGame.personalMissedPoints, i, j)) {
          return 'missed animated';
        }

        if (this.pointIsFound(this.personalPoints, i, j)) {
          return 'placed';
        }
      }
    }
  }

  clear() {
    this.personalPoints = [];
  }

  shipIntersected(shipPoints: HitPoint[]) {
    let intersected = false;
    shipPoints.forEach(p => {
      if (!!this.personalPoints.find(pp => pp.i === p.i && pp.j === p.j)) {
        intersected = true;
      }
    });

    return intersected;
  }

  private initBoard() {
    if (!!this.personalShips) {
      this.personalShips.forEach(s => this.personalPoints = [...this.personalPoints, ...s.hitPoints]);
    }
  }

  private pointIsFound(collection: HitPoint[], i, j) {
    return !!collection && !!collection.find(e => e.i === i && e.j === j);
  }

  private subscribeToYourTurn() {
    this.gameService.yourTurn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(y => {
        if (this.boardMode !== 'attack' || this.gameService.currentGameAlgorythm === 'manual' || !y) {
          return;
        }

        if (!this.gameBot) {
          return;
        }

        const hitPoint = this.gameBot.shoot();
        if (!!hitPoint) {
          this.onClick(hitPoint.i, hitPoint.j);
        }
      });
  }

}
