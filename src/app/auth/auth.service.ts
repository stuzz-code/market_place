import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { BehaviorSubject, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthData } from './auth-data.model';
import { isPlatformBrowser } from '@angular/common';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token?: string;
  private userId?: string | null;
  private isAuthenticated = false;
  private authStatusListener = new BehaviorSubject<boolean>(false);
  private tokenTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone
  ) {
    this.autoAuthUser();
  }

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getUserId() {
    return this.userId;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  createUser(email: string, password: string) {
    const authData: AuthData = { email: email, password: password };
    this.httpClient
      .post('http://localhost:3000/api/user/signup', authData)
      .pipe(
        catchError((error) => {
          console.error('Error creating user:', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('User created:', response);
        },
        error: (error) => {
          console.error('Subscription caught error:', error);
        },
      });
  }

  login(email: string, password: string) {
    const authData: AuthData = { email: email, password: password };
    this.httpClient
      .post<{ token: string; expiresIn: number; userId: string }>(
        'http://localhost:3000/api/user/login',
        authData
      )
      .pipe(
        catchError((error) => {
          console.error('Error creating user:', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Logged in');
          const token = response.token;
          this.token = token;
          if (token) {
            const expiresInDuration = response.expiresIn;
            this.setAuthTimer(expiresInDuration);
            this.isAuthenticated = true;
            this.userId = response.userId;
            this.authStatusListener.next(true);
            const now = new Date();
            const expirationDate = new Date(
              now.getTime() + expiresInDuration * 1000
            );
            this.saveAuthData(token, expirationDate, this.userId);
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Subscription caught error in login:', error);
        },
      });
  }

  logout() {
    this.token = '';
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.userId = '';
    this.router.navigate(['/']);
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      this.authStatusListener.next(false);
      return;
    }
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation?.token;
      this.isAuthenticated = true;
      this.userId = authInformation.userId;
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
    } else {
      this.authStatusListener.next(false);
    }
  }

  private setAuthTimer(duration: number) {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.tokenTimer = setTimeout(() => {
          this.ngZone.run(() => this.logout());
        }, duration * 1000);
      });
    }
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('userId');
  }

  private getAuthData() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const expirationDate = localStorage.getItem('expiration');
      const userId = localStorage.getItem('userId');
      if (!token || !expirationDate) {
        return;
      }
      return {
        token: token,
        expirationDate: new Date(expirationDate),
        userId: userId,
      };
    } catch (error) {
      return null;
    }
  }
}
