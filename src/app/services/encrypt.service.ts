import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AES, enc } from 'crypto-js';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class EncryptService {
  private apiUrl = 'https://controlriesgos.banasan.com.co:8091/itss';
  constructor(private http: HttpClient) {}
  getDecryptedToken(): string | null {
    const encryptedToken = localStorage.getItem('tk');
    if (encryptedToken) {
      const decryptedToken = AES.decrypt(
        encryptedToken,
        'Banasan2023*'
      ).toString(enc.Utf8);
      return decryptedToken || null;
    }
    return null;
  }

  getDecryptedEmail(): string | null {
    const encryptedEmail = localStorage.getItem('correo');
    if (encryptedEmail) {
      const decryptedEmail = AES.decrypt(
        encryptedEmail,
        'Banasan2023*'
      ).toString(enc.Utf8);
      return decryptedEmail || null;
    }
    return null;
  }

  getUser(): Observable<any> {
    const correo = this.getDecryptedEmail();
    const token = this.getDecryptedToken();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.apiUrl}/user/${correo}`, { headers });
  }

  getNotificaciones(): Observable<any> {
    const token = this.getDecryptedToken();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.apiUrl}/notificaciones`, { headers });
  }

  postNotificacion(photo: any, name: any, comment: any): Observable<any> {
    const token = this.getDecryptedToken();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const body = {
      photo: photo,
      name: name,
      message: comment,
    };

    return this.http.post<any[]>(`${this.apiUrl}/notificaciones`, body, {
      headers,
    });
  }
}
