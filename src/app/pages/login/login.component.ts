import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AES } from 'crypto-js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credentials = { correo: '', password: '' };
  token: string | null | undefined;
  isLogged: boolean;
  user: string;
  
  loginForm = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private router: Router) {
    this.isLoggedIn();
  }

  isLoggedIn() {
    this.token = localStorage.getItem('tk');
    if (this.token == undefined) {
      this.isLogged = false;
    } else if (this.token == null) {
      this.isLogged = false;
    } else {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log(this.loginForm.value);

      const headers = new HttpHeaders().set('Content-Type', 'application/json');

      this.http
        .post<any>(`${this.apiUrl}/login`, this.loginForm.value, { headers })
        .subscribe({
          next: (res) => {
            if (res.exito == 1) {
              const tokenToEncrypt: string = res.token || '';
              const emailToEncrypt: string = this.loginForm.value.correo || '';

              const encryptedToken = AES.encrypt(
                tokenToEncrypt,
                'Banasan2023*'
              ).toString();
              const encryptedEmail = AES.encrypt(
                emailToEncrypt,
                'Banasan2023*'
              ).toString();

              localStorage.setItem('tk', encryptedToken);
              localStorage.setItem('correo', encryptedEmail);
              localStorage.setItem('user', res.user.name);

              this.router.navigate(['/']);
            }
          },
          error: (error) => {
            alert(error.error.error);
          },
        });
    } else {
      alert('Verifica los Campos, por favor.');
    }
  }
}
