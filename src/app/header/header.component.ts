import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { NgIf, CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    CommonModule,
    NgIf,
    MatProgressSpinnerModule,
  ],
  styleUrls: ['./header.component.css'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnDestroy, OnInit {
  isLoading = true;
  userIsAuthenticated: boolean | null = null;
  private authListenerSubs?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.autoAuthUser();

    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        this.isLoading = false;
      });
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListenerSubs?.unsubscribe();
  }
}
