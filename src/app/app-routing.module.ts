import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { GameComponent } from './game/game.component';
import { SetupComponent } from './setup/setup.component';
import { JoinComponent } from './join/join.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'game', component: GameComponent },
  { path: 'setup', component: SetupComponent },
  { path: 'join', component: JoinComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
