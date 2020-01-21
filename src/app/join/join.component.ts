import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GameService } from '../core/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {

  @ViewChild('joinInput', { static: false }) joinInput: ElementRef;

  constructor(
    private gameService: GameService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  joinGame() {
    const id = this.joinInput.nativeElement.value;
    this.gameService.joinGame(id);
    this.router.navigate(['/setup']);
  }

}
