import { Component, Input, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../../templates/header/header.component';
import { ConectividadComponent } from '../conectividad/conectividad.component';
import { EstatusComponent } from '../estatus/estatus.component';
import { ConfiguracionesComponent } from '../configuraciones/configuraciones.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { EncryptService } from '../../services/encrypt.service';
import { PoolsComponent } from '../pools/pools.component';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, ConectividadComponent, EstatusComponent, ConfiguracionesComponent, CommonModule, HttpClientModule, PoolsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent{

  notificaciones: any[] = [];
  isAdmin = false;
  constructor(
    private http: HttpClient,
    private router: Router,
    private service: EncryptService
  ) {
    this.GetUser();
      this.service.getNotificaciones().subscribe({
      next: (res) => {
        this.notificaciones = res.slice().reverse();
      },
      error: (error) => {
        console.log(error.error);
      }
    });
  }

  private apiUrl = 'http://ess:8090/api';
  data: any;
  vista: string = 'Pools & Eventos';

  GetUser() {
    const authToken = this.service.getDecryptedToken();
    const correo = this.service.getDecryptedEmail();
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<any>(`${this.apiUrl}/user/${correo}`, { headers }).subscribe({
      next: (res) => {
        if (res.exito == 1) {
          this.data = res.data;
          if(this.data.rol == 'Admin'){
            this.isAdmin = true;
          }
        }else{
          localStorage.removeItem('tk');
          localStorage.removeItem('correo');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        localStorage.removeItem('tk');
        localStorage.removeItem('correo');
        this.router.navigate(['/login']);
      },
    });
  }

  logout() {
    const authToken = this.service.getDecryptedToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    });

    this.http.get<any>(`${this.apiUrl}/logout`, { headers }).subscribe({
      next: (res) => {
        localStorage.removeItem('tk');
        localStorage.removeItem('correo');
        localStorage.removeItem('user');  
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  changeEstatus() {
    this.vista = 'Estatus';
  }

  changePools() {
    this.vista = 'Pools & Eventos';
  }

  changeConectividad() {
    this.vista = 'Conectividad';
  }

  changeConfiguraciones() {
    this.vista = 'Configuraciones';
  }
}
