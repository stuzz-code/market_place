import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ProductListComponent } from './products/list product/list-product.component';
import { ProductCreateComponent } from './products/create-product/create-product.component';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  {
    path: 'create',
    component: ProductCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit/:productId',
    component: ProductCreateComponent,
    canActivate: [AuthGuard],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
];
