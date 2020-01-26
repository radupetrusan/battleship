import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Game } from 'src/app/shared/models/game';
import { Ship } from 'src/app/shared/models';
import { map } from 'rxjs/operators';
import { GameMessage } from 'src/app/shared/models/game-message';
import { ActionType } from 'src/app/shared/models/action-type';
import { HitType } from 'src/app/shared/models/hit-type';
import { ReplaySubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GameService {

    gamesCollection = 'games';
    messagesCollection = 'messages';

    currentGameOwner: boolean = null;
    currentGameId: string = null;
    currentConfiguration: Ship[];
    currentGame: Game = null;
    currentGameAlgorythm: string = null;
    yourTurn = false;

    yourTurn$ = new ReplaySubject<boolean>(null);

    constructor(
        private firestore: AngularFirestore,
    ) { }

    gameMessagesCollection = gameId => `${this.gamesCollection}/${gameId}/${this.messagesCollection}`;

    getGame(gameId) {
        return this.firestore
            .collection<Game>(this.gamesCollection)
            .doc<Game>(gameId)
            .snapshotChanges()
            .pipe(
                map(game => {
                    const data = game.payload.data() as Game;
                    const id = game.payload.id;

                    return { id, ...data } as Game;
                })
            );
    }

    getGameMessages(gameId) {
        const destination = this.currentGameOwner ? 'owner' : 'guest';
        return this.firestore
            .collection<GameMessage>(this.gameMessagesCollection(gameId), ref => {
                return ref
                    .where('destination', '==', destination)
                    .where('unread', '==', true);
            })
            .snapshotChanges()
            .pipe(
                map(messages => {
                    return messages.map(message => {
                        const data = message.payload.doc.data() as GameMessage;
                        const id = message.payload.doc.id;

                        return { id, ...data } as GameMessage;
                    });
                })
            );
    }

    createGame(game: Game, ships: Ship[], gameAlgorythm: string) {
        this.currentGameOwner = true;
        this.currentConfiguration = ships;
        this.currentGameAlgorythm = gameAlgorythm;

        return this.firestore.collection(this.gamesCollection)
            .add({ ...game })
            .then(ref => {
                this.currentGameId = ref.id;
                return ref;
            });
    }

    sendMessage(message: GameMessage) {
        const collection = this.gameMessagesCollection(this.currentGameId);
        this.firestore
            .collection(collection)
            .add({
                ...message,
                hitPoint: { ...message.hitPoint },
                destroyedShip: {
                    ...message.destroyedShip,
                    hitPoints: !!message.destroyedShip ? [...message.destroyedShip.hitPoints.map(p => ({ ...p })) || []] : []
                }
            });
    }

    joinGame(gameId: string) {
        this.currentGameOwner = false;
        this.currentGameId = gameId;
    }

    placeShips(ships: Ship[], gameAlgorythm: string) {
        if (!this.currentGameId) {
            return;
        }

        this.currentConfiguration = ships;
        this.currentGameAlgorythm = gameAlgorythm;

        this.firestore
            .collection(this.gamesCollection)
            .doc(this.currentGameId)
            .update({ turn: 'owner' });
    }

    clear() {
        this.currentGameId = null;
        this.currentGameOwner = null;
        this.currentConfiguration = null;
        this.currentGame = null;
        this.currentGameAlgorythm = null;
    }

    changeTurn() {
        if (!this.currentGameId) {
            return;
        }
        const turn = this.currentGameOwner ? 'owner' : 'guest';

        this.firestore
            .collection(this.gamesCollection)
            .doc(this.currentGameId)
            .update({ turn });
    }

    markMessageAsRead(messageId) {
        if (!this.currentGameId) {
            return;
        }

        return this.firestore
            .collection(this.gameMessagesCollection(this.currentGameId))
            .doc(messageId)
            .update({ unread: false });
    }

    proccessMessage(message: GameMessage) {
        this.markMessageAsRead(message.id);

        if (!this.currentConfiguration) {
            return;
        }

        switch (message.messageType) {
            case ActionType.Attack: {
                this.proccessAttack(message);
                break;
            }
            case ActionType.Response: {
                this.proccessResponse(message);
                break;
            }

        }
    }

    proccessAttack(message: GameMessage) {
        let found = false;

        this.currentConfiguration.forEach(s => {
            const point = s.hitPoints.find(p => p.i === message.hitPoint.i && p.j === message.hitPoint.j);
            if (!!point) {
                found = true;
                // Check if ship is destroyed
                // response.hitPoint.hitType = HitType.Hit;
                // this.sendMessage(response);
                // return;
            }
        });

        const response = new GameMessage({
            messageType: ActionType.Response,
            destination: this.currentGameOwner ? 'guest' : 'owner',
            hitPoint: { ...message.hitPoint, hitType: found ? HitType.Hit : HitType.Missed }
        });

        if (found) {
            this.currentGame.personalHitPoints.push(message.hitPoint);

            const hitShip = this.currentConfiguration
                .find(ship => !!ship.hitPoints.find(p => p.i === message.hitPoint.i && p.j === message.hitPoint.j));
            let destroyed = true;
            if (!!hitShip) {
                hitShip.hitPoints.forEach(p => {
                    if (!this.currentGame.personalHitPoints.find(pp => pp.i === p.i && pp.j === p.j)) {
                        destroyed = false;
                    }
                });
                if (destroyed) {
                    response.destroyedShip = hitShip;
                    this.currentGame.personalDestroyedPoints = [...this.currentGame.personalDestroyedPoints, ...hitShip.hitPoints];

                    if (this.currentGame.totalPoints === this.currentGame.personalDestroyedPoints.length) {
                        setTimeout(() => {
                            alert('You lost!');
                        }, 100);
                    }
                }
            }
        } else {
            this.changeTurn();
            this.currentGame.personalMissedPoints.push(message.hitPoint);
        }
        this.sendMessage(response);
    }

    proccessResponse(message: GameMessage) {
        if (!!message.destroyedShip && !!message.destroyedShip.hitPoints && !!message.destroyedShip.hitPoints.length) {
            this.yourTurn = true;
            this.yourTurn$.next(true);
            this.currentGame.enemyDestroyedPoints = [...this.currentGame.enemyDestroyedPoints, ...message.destroyedShip.hitPoints];

            if (this.currentGame.totalPoints === this.currentGame.enemyDestroyedPoints.length) {
                alert('You won!');
            }

        }

        if (message.hitPoint.hitType === HitType.Hit) {
            this.yourTurn = true;
            this.yourTurn$.next(true);
            this.currentGame.enemyHitPoints.push(message.hitPoint);
        } else {
            this.currentGame.enemyMissedPoints.push(message.hitPoint);
        }
    }

}
