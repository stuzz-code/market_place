import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';

import { ProductsService } from '../product.service';
import { Product } from '../product.model';
import { AuthService } from '../../auth/auth.service';
import { mimeType } from './mime-type.validator';

@Component({
  selector: 'app-product-create',
  standalone: true,
  styleUrls: ['./create-product.component.css'],
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-product.component.html',
})
export class ProductCreateComponent implements OnInit {
  @Input()
  product: Product | null = null;
  isLoading = false;
  form!: FormGroup;
  imagePreview: string = '';
  public mode = 'create';
  private productId: string = '';

  constructor(
    public productsService: ProductsService,
    public route: ActivatedRoute,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)],
      }),
      inventory: new FormControl(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
      price: new FormControl(null, {
        validators: [Validators.required, Validators.min(0.01)],
      }),
      image: new FormControl(null, {
        validators: [Validators.required],
        asyncValidators: [mimeType],
      }),
    });
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('productId')) {
        this.mode = 'edit';
        this.productId = paramMap.get('productId') ?? '';
        this.isLoading = true;
        this.productsService.getProduct(this.productId).subscribe({
          next: (productData) => {
            this.isLoading = false;
            this.product = {
              id: productData._id,
              name: productData.name,
              inventory: productData.inventory,
              price: productData.price,
              imagePath: productData.imagePath,
              creator: productData.creator,
            };
            this.form.setValue({
              name: this.product.name,
              inventory: this.product.inventory,
              price: this.product.price,
              image: this.product.imagePath,
            });
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error getting product:', error);
          },
        });
      } else {
        this.mode = 'create';
        this.productId = '';
      }
    });
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.form.patchValue({ image: file });
    this.form.get('image')?.updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;

    const userId = this.authService.getUserId() ?? '';

    const product = {
      id: this.mode === 'create' ? '' : this.productId,
      name: this.form.value.name,
      inventory: +this.form.value.inventory,
      price: +this.form.value.price,
      image: this.form.value.image,
      creator: userId,
    };

    let request$;
    if (this.mode === 'create') {
      request$ = this.productsService.addProduct(
        this.form.value.name,
        this.form.value.inventory,
        this.form.value.price,
        this.form.value.image
      );
    } else {
      request$ = this.productsService.updateProduct(
        product.id,
        product.name,
        product.inventory,
        product.price,
        product.image,
        product.creator
      );
    }
    request$.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.form.reset();
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.isLoading = false;
      },
    });
  }
}
