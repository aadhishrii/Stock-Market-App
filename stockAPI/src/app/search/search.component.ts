import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuyPopupComponent } from '../buy-popup/buy-popup.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, map, Observable, startWith, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {
  title = 'stockAPI';
  filteredOptions: any[] = [];
  myForm: FormGroup;
  ticker: string = '';
  selectedTab: string = 'details';
  cleared: string = 'NONE';
  metadata: any = null; 
  balance: any = null;
  latestPrice: any = null;
  isInWishlist: boolean = false;
  notEnoughMoney: boolean = false;
  quantity: number = 0; // Default quantity is 1
  totalCost: number = 0;
  marketOpen: boolean = true;
  showSellButton: boolean = false;
  showTabs: boolean = false;
  @Output() clearSearchEvent = new EventEmitter<void>();
  autocompleteResults: Observable<any[]> = new Observable<any[]>();
  searchControl = new FormControl();
  isLoading: boolean = false;
  tickerValid: boolean = true;

  constructor(private http: HttpClient, private snackBar: MatSnackBar, private dialog: MatDialog) {
    this.myForm = new FormGroup({
      ticker: new FormControl('')
    });
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this.getAutocomplete(value))
    ).subscribe(options => {
      this.filteredOptions = options;
    });
  }

  getAutocomplete(value: string) {
    var response = this.http.get<any[]>(`http://localhost:3000/api/v1.0.0/searchutil/${value}`) 
    console.log('auto complete results', response)
    return response
  }

  search(val: string): Observable<any[]> {
    // return this.http.get<any[]>(`http://localhost:3000/api/v1.0.0/searchutil/${val}`);
    return this.http.get<any[]>(`http://localhost:3000/api/v1.0.0/searchutil/${val}`);
  }

  showDetails() {
    this.selectedTab = 'details';
  }

  showNews() {
    this.selectedTab = 'news';
  }

  showCharts() {
    this.selectedTab = 'charts';
  }

  showInsights() {
    this.selectedTab = 'insights';
  }


  openBuyPopup(ticker: string, curPrice: number): void {
    
  }

  onSearch() {
    console.log('Searching For: ', this.myForm.value.ticker);
    this.isLoading = true; // Indicate loading at the start
  
    // Start a timer that waits for 3 seconds (3000 milliseconds) before continuing.
    const searchDelay = timer(2000);
  
    searchDelay.subscribe(() => {
      this.cleared = '';
      this.ticker = this.myForm.value.ticker; // Update the ticker value
      this.isInWishlist = false;
      this.selectedTab = 'details';
      this.fetchMetadata(this.myForm.value.ticker);
      this.fetchLatestPrice(this.myForm.value.ticker);
      this.isLoading = false;
  
      // Check for wishlist status might need to be inside fetchMetadata's subscription
    });
  }
  
  
  // onSearch() {
  //   console.log('Searching For: ', this.myForm.value.ticker);
  //   this.cleared = '';
  //   this.ticker = this.myForm.value.ticker; // Update the ticker value
  //   this.isInWishlist = false;
  //   this.selectedTab = 'details';
  //   this.fetchMetadata(this.myForm.value.ticker);
  //   this.fetchLatestPrice(this.myForm.value.ticker);
  //   if(this.metadata){
  //     this.isInWishlist = this.metadata.isWatchlist;
  //   }
  // }

  showAlert(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // Duration in milliseconds after which the snack-bar will auto-dismiss.
    });
  }

  // ... other component code

  selectTab(tabId: string, event: Event): void {
    event.preventDefault(); // prevent default anchor behavior
    this.selectedTab = tabId;
  }

// ... other component code


  toggleWishlist(tickerValue: string): void {
    this.isInWishlist = !this.isInWishlist;
    if (this.isInWishlist) {
      // If it's being added to the wishlist
      this.http.post<any>('http://localhost:3000/api/v1.0.0/watchlistpost', { ticker: tickerValue })
        .subscribe({
          next: (response) => {
            // Handle successful addition here
            this.showAlert('Stock added to Watchlist.');
            // Update metadata.isWatchlist to true as it's now in the wishlist
            this.metadata.isWatchlist = true;
          },
          error: (error) => {
            // Handle error here
            console.error('Error adding stock to watchlist:', error);
            // Revert isInWishlist if the operation failed
            this.isInWishlist = false;
          }
        });
    } else {
      // If it's being removed from the wishlist
      this.http.delete<any>(`http://localhost:3000/api/v1.0.0/watchlist/${tickerValue}`)
        .subscribe({
          next: (response) => {
            // Handle successful removal here
            this.showAlert('Stock removed from Watchlist.');
            // Update metadata.isWatchlist to false as it's now removed from the wishlist
            this.metadata.isWatchlist = false;
          },
          error: (error) => {
            // Handle error here
            console.error('Error removing stock from watchlist:', error);
            // Revert isInWishlist if the operation failed
            this.isInWishlist = true;
          }
        });
    }
    // Optionally handle removal from the wishlist if needed
  }


  fetchMetadata(tickerValue: string) {
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/metadata/${tickerValue}`).subscribe(
      (response) => {
        console.log('Metadata:', response);
        this.metadata = response;
        this.showSellButton = this.metadata.existsInPortfolio;
        this.showTabs = true;
        if (!this.metadata.name){
          this.tickerValid = false;
          this.selectedTab = '';
        }
        else{
          this.tickerValid = true;
        }
      console.log('show sell button', this.showSellButton) ;
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching metadata:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  fetchLatestPrice(tickerValue: string) {
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/latestprice/${tickerValue}`).subscribe(
      (response) => {
        console.log('Latest Price:', response);
        this.latestPrice = response;
        this.marketOpen = response.marketOpen;
        // Handle the latest price response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching latest price:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  fetchWalletBalance (){
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/wallet`).subscribe(
      (response) => {
        console.log('Wallet Balance:', response);
        this.balance = response;
        // Handle the metadata response here, e.g., display it in the UI
        // Iterate over each ticker in the watchlist and fetch metadata and latest price
      },
      (error) => {
        console.error('Error fetching watchlist:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  checkCost(quantity: number): void {
    console.log('latest price', this.latestPrice.c);
    this.totalCost = quantity * this.latestPrice.c;
    console.log('total cost', this.totalCost);
    console.log('total cost', this.balance);
    this.notEnoughMoney = this.totalCost > this.balance.balance;
  }

  // handleSearchEvent(value: string) {
  //   console.log('Received value from child:', value);
  //   this.cleared = '';
  //   this.myForm.value.ticker = value;
  //   this.onSearch();
  //   // Call any function or perform any action in the parent component
  // }

  clearSearch() {
    this.myForm.reset();
    this.cleared = 'CLEAR';
    this.selectedTab = 'details'; // Switch to the details tab after clearing
    this.ticker = '';
    this.metadata = null;
    this.latestPrice = null;
    this.showTabs = false;
    this.tickerValid = true;
    // this.clearSearchEvent.emit();
  }

  updateBuy(totalCost:number,curPrice:number,quantity:number){
    if (quantity > 0){
      this.updateWallet(totalCost);
      this.updatePortfolio(totalCost,curPrice,quantity);
      this.showSellButton = true;
    }
  }

  updatePortfolio(totalCost:number,curPrice:number,quantity:number){
    this.http.post<any>('http://localhost:3000/api/v1.0.0/portfolio', { ticker: this.myForm.value.ticker, totalCost:totalCost,curPrice:curPrice,quantity:quantity })
    .subscribe(response => {
    // Handle response here
    this.showAlert('Stock added to Portfolio.');
    }, error => {
    // Handle error here
    console.error('Error adding stock to portfolio:', error);
    });
  }

  updateWallet(purchaseAmt: number): void {
    var remainingAmt = this.balance.balance - purchaseAmt;
    console.log('wallet update', remainingAmt);
    this.http.post<any>('http://localhost:3000/api/v1.0.0/walletupdate', { balance: String(remainingAmt) })
      .subscribe(response => {
        // Handle response here
        this.showAlert('Wallet updated');
        this.quantity = 0;
        this.totalCost = 0;
      }, error => {
        // Handle error here
        console.error('Error updating wallet:', error);
      });
  // Optionally handle removal from the wishlist if needed
}

async updateSell(totalCost: number, curPrice: number, quantity: number, ticker: string) {
  if (quantity <= 0) return;

  try {
    // Similar structure as updateBuy
    await this.updateWallet(Number(this.balance.balance) + totalCost);
    await this.updatePortfolio(totalCost, curPrice, quantity);
    this.showAlert('Stock sold successfully.');
  } catch (error) {
    console.error('Error during sell operation:', error);
    // Handle errors
  }
}
}


