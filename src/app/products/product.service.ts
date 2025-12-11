import { Product } from './product.model';
import { Injectable, Input } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

const PRODUCTS: Product[] = [];

@Injectable({ providedIn: 'root' })
export class ProductsService {
  @Input() private products: Product[] = [];
  private productsUpdated = new BehaviorSubject<{
    products: Product[];
    productCount: number;
  }>({ products: [], productCount: 0 });
  private editingProduct: Product | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  // setEditingProduct(product: Product) {
  //   this.editingProduct = product;
  //   this.productsUpdated.next([...this.products]);
  // }

  getEditingProduct(product: Product) {
    return (this.editingProduct = product);
  }

  getProducts(productsPerPage: number, currentPage: number) {
    const queryParams = `?pageSize=${productsPerPage}&page=${currentPage}`;
    this.http
      .get<{ message: string; products: any[]; maxProducts: number }>(
        'http://localhost:3000/api/products' + queryParams
      )
      .pipe(
        map((productData) => {
          return {
            products: productData.products.map((product) => {
              return {
                name: product.name,
                inventory: product.inventory,
                price: product.price,
                id: product._id,
                imagePath: product.imagePath || '',
                creator: product.creator,
              };
            }),
            maxProducts: productData.maxProducts,
          };
        }),
        catchError((error) => {
          console.error('Error fetching products:', error);
          throw error;
        })
      )
      .subscribe((transformedProductData) => {
        this.products = transformedProductData.products;
        this.productsUpdated.next({
          products: [...this.products],
          productCount: transformedProductData.maxProducts,
        });
      });
  }

  getProductUpdateListener() {
    return this.productsUpdated.asObservable();
  }

  getProduct(id: string) {
    return this.http
      .get<{
        _id: string;
        name: string;
        inventory: number;
        price: number;
        imagePath: string;
        creator: string;
      }>(`http://localhost:3000/api/products/` + id)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product:', error);
          throw error;
        })
      );
  }

  addProduct(name: string, inventory: number, price: number, image: File) {
    const productData = new FormData();
    productData.append('name', name);
    productData.append('inventory', inventory.toString());
    productData.append('price', price.toString());
    productData.append('image', image, name);

    return this.http
      .post<{ message: string; product: Product }>(
        'http://localhost:3000/api/products',
        productData
      )
      .pipe(
        catchError((error) => {
          console.error('Error adding product:', error);
          throw error;
        })
      );
  }

  updateProduct(
    id: string,
    name: string,
    inventory: number,
    price: number,
    image: File | string,
    creator: string
  ): Observable<{ message: string }> {
    let productData: Product | FormData;
    if (typeof image === 'object') {
      productData = new FormData();
      productData.append('id', id);
      productData.append('name', name);
      productData.append('inventory', inventory.toString());
      productData.append('price', price.toString());
      productData.append('image', image, name);
      productData.append('creator', creator);
    } else {
      productData = {
        id,
        name,
        inventory,
        price,
        imagePath: image,
        creator,
      };
    }

    return this.http
      .patch<{ message: string }>(
        'http://localhost:3000/api/products/' + id,
        productData
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching product:', error);
          throw error;
        })
      );
  }

  deleteProduct(productId: string) {
    return this.http
      .delete('http://localhost:3000/api/products/' + productId)
      .pipe(
        catchError((error) => {
          console.error('Error fetching product:', error);
          throw error;
        })
      );
  }
}
