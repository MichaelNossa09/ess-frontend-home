import { Component, Input, OnDestroy } from '@angular/core';
import { EncryptService } from '../../services/encrypt.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataPoolService } from '../../services/data-pool.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy{
  public clicked: boolean = false;
  user : any;
  @Input() notificaciones: any[] = [];
  private subscription: Subscription;
  constructor(private service: EncryptService, private route: Router, private notiService: DataPoolService){
    this.service.getUser().subscribe({
      next: (res) => {
        this.user = res.data;
      },
      error : (error) => {
        alert(error.error.error)
      }
    });
    this.subscription = this.notiService.data$.subscribe((data) => {
      this.notificaciones = data; 
    })
  }
  mostrarNotificaciones: boolean = false;
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  menu(){
    this.clicked = !this.clicked;
    this.service.toggleMenu();
  }
  toggleMostrar() {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }
}
