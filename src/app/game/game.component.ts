import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../core/services';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';
import { GameMessage } from '../shared/models/game-message';
import { ActionType } from '../shared/models/action-type';
import { HitType } from '../shared/models/hit-type';
import { Game } from '../shared/models/game';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  private destroy$ = new ReplaySubject<boolean>();

  get yourTurn() {
    return this.gameService.yourTurn;
  }

  constructor(
    private gameService: GameService
  ) { }

  get gameId() {
    return this.gameService.currentGameId;
  }

  get owner() {
    return !!this.gameService.currentGameOwner;
  }

  get personalShips() {
    return this.gameService.currentConfiguration;
  }

  ngOnInit() {
    this.subscribeToGame();
    this.subscribeToGameMessages();
  }

  ngOnDestroy() {
    this.gameService.clear();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private subscribeToGame() {
    if (!this.gameService.currentGameId) {
      return;
    }

    this.gameService.getGame(this.gameService.currentGameId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(game => {
        if (
          (!this.gameService.currentGame || game.turn !== this.gameService.currentGame.turn) &&
          (
            (this.gameService.currentGameOwner && game.turn === 'owner') ||
            (!this.gameService.currentGameOwner && game.turn === 'guest')
          )) {
          this.gameService.yourTurn = true;
          this.gameService.yourTurn$.next(true);
        } else {
          this.gameService.yourTurn = false;
        }

        if (!this.gameService.currentGame) {
          this.gameService.currentGame = new Game();
        }

        this.gameService.currentGame = {
          ...game,
          enemyDestroyedPoints: [...game.enemyDestroyedPoints || [], ...this.gameService.currentGame.enemyDestroyedPoints || []],
          enemyHitPoints: [...game.enemyHitPoints || [], ...this.gameService.currentGame.enemyHitPoints || []],
          enemyMissedPoints: [...game.enemyMissedPoints || [], ...this.gameService.currentGame.enemyMissedPoints || []],
          personalDestroyedPoints: [...game.personalDestroyedPoints || [], ...this.gameService.currentGame.personalDestroyedPoints || []],
          personalHitPoints: [...game.personalHitPoints || [], ...this.gameService.currentGame.personalHitPoints || []],
          personalMissedPoints: [...game.personalMissedPoints || [], ...this.gameService.currentGame.personalMissedPoints || []]
        };
      });
  }

  private subscribeToGameMessages() {
    if (!this.gameService.currentGameId) {
      return;
    }

    this.gameService.getGameMessages(this.gameService.currentGameId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(messages => {
        if (!!messages) {
          messages.forEach(m => this.gameService.proccessMessage(m));
        }
      });
  }

}
