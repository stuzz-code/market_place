import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { Product } from '../product.model';
import { ProductsService } from '../product.service';
import { Subscription } from 'rxjs';
import { ProductCreateComponent } from '../create-product/create-product.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  styleUrls: ['./list-product.component.css'],
  imports: [
    MatButtonModule,
    CommonModule,
    MatExpansionModule,
    FormsModule,
    ProductCreateComponent,
    MatProgressSpinnerModule,
    RouterModule,
    MatPaginatorModule,
  ],
  templateUrl: './list-product.component.html',
})
export class ProductListComponent implements OnInit, OnDestroy {
  @Input() products: Product[] = [];
  userIsAuthenticated = false;
  userId?: string | null;
  isLoading = false;
  totalProducts = 0;
  productsPerPage = 25;
  currentPage = 1;
  private productsSub?: Subscription;
  private AuthStatusSub?: Subscription;

  constructor(
    public productsService: ProductsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.productsService.getProducts(this.productsPerPage, this.currentPage);
    this.userId = this.authService.getUserId();
    this.productsSub = this.productsService
      .getProductUpdateListener()
      .subscribe(
        (productData: { products: Product[]; productCount: number }) => {
          this.isLoading = false;
          this.totalProducts = productData.productCount;
          this.products = productData.products;
        }
      );
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.AuthStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      });
  }

  get availableProducts(): Product[] {
    return this.products.filter((product) => product?.inventory > 0);
  }

  onChangedPage(pageData: PageEvent) {
    this.currentPage = pageData.pageIndex + 1;
    this.productsPerPage = pageData.pageSize;
    this.productsService.getProducts(this.productsPerPage, this.currentPage);
  }

  ngOnDestroy() {
    this.productsSub?.unsubscribe();
    this.AuthStatusSub?.unsubscribe();
  }

  selectedProduct?: Product;

  onFormSubmitted() {
    this.selectedProduct = undefined;
  }

  onDeleteProduct(productId: string) {
    this.isLoading = true;
    if (!productId) return;
    this.productsService.deleteProduct(productId).subscribe({
      next: () => {
        this.productsService.getProducts(
          this.productsPerPage,
          this.currentPage
        );
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }
}
