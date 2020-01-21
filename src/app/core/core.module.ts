import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ShipsService,
  GameService
} from './services';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    ShipsService,
    GameService
  ]
})
export class CoreModule { }
