import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { faSearch, faSpinnerThird } from '@fortawesome/pro-duotone-svg-icons';

import { BarcodeService } from '../../../shared/services/barcode.service';

import {
  GraphQlPageableInput,
  SimpleProductEntity,
  SimpleProductFilterGQL,
  SimpleProductFindBySkuGQL,
  SimpleProductFindByUpcGQL,
  SimpleProductInfoGQL
} from '../../../../../generated/graphql';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styles: []
})
export class InventoryComponent implements OnInit, OnDestroy {
  faSpinnerThird = faSpinnerThird;
  faSearch = faSearch;

  searchTerm = '';

  upc = '';
  sku = '';
  bin = '';

  loading = 0;
  upcScannedSubscription: Subscription;
  skuScannedSubscription: Subscription;

  simpleProduct: SimpleProductEntity;
  searchResults: SimpleProductEntity[];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private barcodeService: BarcodeService,
    private simpleProductInfo: SimpleProductInfoGQL,
    private simpleProductFindByUpcGQL: SimpleProductFindByUpcGQL,
    private simpleProductFindBySkuGQL: SimpleProductFindBySkuGQL,
    private simpleProductFilterGQL: SimpleProductFilterGQL
  ) {}

  ngOnInit() {
    this.upcScannedSubscription = this.barcodeService.upcScanned$.subscribe(
      (upc) => {
        this.upc = upc;
        if (this.upc) {
          this.loading++;
          this.changeDetectorRef.detectChanges();
          this.simpleProductFindByUpcGQL
            .fetch({ upc: this.upc })
            .pipe(map((result) => result.data.simpleProductFindByUpc))
            .subscribe(
              (result) => {
                this.simpleProduct = result as SimpleProductEntity;
                this.loading--;
                this.changeDetectorRef.detectChanges();
              },
              (error) => {
                console.error(error);
                this.loading--;
                this.changeDetectorRef.detectChanges();
              }
            );
        }
      }
    );

    this.skuScannedSubscription = this.barcodeService.skuScanned$.subscribe(
      (sku) => {
        this.sku = sku;
        if (this.sku) {
          this.loading++;
          this.changeDetectorRef.detectChanges();
          this.simpleProductFindBySkuGQL
            .fetch({ sku: this.sku })
            .pipe(map((result) => result.data.simpleProductFindBySku))
            .subscribe(
              (result) => {
                this.simpleProduct = result as SimpleProductEntity;
                this.loading--;
                this.changeDetectorRef.detectChanges();
              },
              (error) => {
                console.error(error);
                this.loading--;
                this.changeDetectorRef.detectChanges();
              }
            );
        }
      }
    );
  }

  load(id: string) {
    this.searchTerm = '';
    this.searchResults = [];
    this.loading++;
    this.changeDetectorRef.detectChanges();
    this.simpleProductInfo
      .fetch({ id })
      .pipe(map((result) => result.data.simpleProductInfo))
      .subscribe(
        (result) => {
          this.simpleProduct = result as SimpleProductEntity;
          this.loading--;
          this.changeDetectorRef.detectChanges();
        },
        (error) => {
          console.error(error);
          this.loading--;
          this.changeDetectorRef.detectChanges();
        }
      );
  }

  search() {
    const pageable: GraphQlPageableInput = {
      page: 1,
      pageSize: 5
    };

    this.simpleProductFilterGQL
      .fetch({ pageable, sku: this.searchTerm + '%' })
      .pipe(map((result) => result.data.simpleProductFilter.data))
      .subscribe(
        (result) => {
          this.searchResults = result as SimpleProductEntity[];
          console.log(this.searchResults);
          this.changeDetectorRef.detectChanges();
        },
        (error) => {
          this.changeDetectorRef.detectChanges();
        }
      );
  }

  ngOnDestroy(): void {
    this.upcScannedSubscription.unsubscribe();
    this.skuScannedSubscription.unsubscribe();
  }
}