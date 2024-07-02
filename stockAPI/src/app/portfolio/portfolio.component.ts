import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { WatchlistService } from '../watchlist.service'; // Adjust the path as needed
import { Subscription } from 'rxjs/internal/Subscription';
import { forkJoin, interval, Observable, timer } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit{
  watchlist: any[] = [];
  tickerData: { [key: string]: any } = {};
  balance: any = null;
  quantity: number = 0; // Default quantity is 1
  totalCost: number = 0;
  notEnoughMoney: boolean = false;
  private refreshSubscription: Subscription = new Subscription();
  isLoading: boolean = true;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.fetchWatchlist();
    this.fetchWalletBalance();
    this.refreshSubscription = interval(200000).subscribe(() => {
      this.fetchWatchlist();
    });
  }
  ngOnDestroy(): void {
    // Unsubscribe from the refresh interval when the component is destroyed
    if (!this.refreshSubscription.closed) {
      this.refreshSubscription.unsubscribe();
    }
  }
  fetchMetadata(tickerValue: string) {
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/metadata/${tickerValue}`).subscribe(
      (response) => {
        // Find the index of the ticker data in the array
        this.tickerData[tickerValue] = this.tickerData[tickerValue] || {};
        this.tickerData[tickerValue].metadata = response;
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
        // Find the index of the ticker data in the array
        this.tickerData[tickerValue] = this.tickerData[tickerValue] || {};
        this.tickerData[tickerValue].latestPrice = response;
      },
      (error) => {
        console.error('Error fetching latest price:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }
  fetchWatchlist(){
    const timer$ = timer(3000);
    // Create a timer observable that emits once after 3000ms (3 seconds)

  // Convert your HTTP request to an observable without subscribing immediately
  const fetchData$ = this.http.get<any>(`http://localhost:3000/api/v1.0.0/portfolio`);

  // Use forkJoin to wait for both the timer and the fetch data observable to complete
  forkJoin({ data: fetchData$, timer: timer$ }).subscribe({
    next: (result) => {
      console.log('Watchlist:', result.data);
      this.watchlist = result.data;
      this.isLoading = false;
      // Handle the metadata response here, e.g., display it in the UI
      // Iterate over each ticker in the watchlist and fetch metadata and latest price
      this.watchlist.forEach((item) => {
        this.fetchMetadata(item.ticker);
        this.fetchLatestPrice(item.ticker);
      });
    },
    error: (error) => {
      console.error('Error fetching watchlist:', error);
      // Handle errors, e.g., display an error message to the user
    },
    complete: () => {
      this.isLoading = false; // Stop loading
    }
  });
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
  // deleteTicker(ticker: string): void {
  //   // Make HTTP request to delete ticker from the database
  //   this.http.delete<any>(`http://localhost:3000/api/v1.0.0/watchlist/${ticker}`).subscribe(
  //     () => {
  //       console.log(`Ticker ${ticker} deleted successfully.`);
  //       // After successful deletion, remove the ticker from the local data array
  //       this.tickerData = this.tickerData.filter(item => item.ticker !== ticker);
  //     },
  //     (error) => {
  //       console.error('Error deleting ticker:', error);
  //       // Handle error if deletion fails
  //     }
  //   );
  // }
  checkCost(quantity: number, ticker:string): void {
    console.log('latest price', this.tickerData[ticker].latestPrice.c);
    this.totalCost = quantity * this.tickerData[ticker].latestPrice.c;
    console.log('total cost', this.totalCost);
    console.log('total cost', this.balance);
    this.notEnoughMoney = this.totalCost > this.balance.balance;
  }
  checkQuant(quantity: number, curQant: number, ticker:string): void {
    // console.log('latest price', this.tickerData[ticker].latestPrice.c);
    this.totalCost = quantity * this.tickerData[ticker].latestPrice.c;
    // console.log('total cost', this.totalCost);
    // console.log('total cost', this.balance);
    this.notEnoughMoney = curQant < quantity;
  }
  // updateBuy(totalCost:number,curPrice:number,quantity:number,ticker:string){
  //   if (quantity > 0){
  //     this.updateWallet(totalCost);
  //     this.updatePortfolio(totalCost,curPrice,quantity,ticker, true);
  //     window.location.reload();
  //   }
  // }

  async updateBuy(totalCost: number, curPrice: number, quantity: number, ticker: string) {
    if (quantity <= 0) return;
  
    try {
      // Update wallet and wait for it to complete
      await this.updateWallet(Number(this.balance.balance)-totalCost);
      // Then update portfolio and wait for it to complete
      await this.updatePortfolio(totalCost, curPrice, quantity, ticker, true);
      // After both are complete, refresh the watchlist
      this.fetchWatchlist();
      this.showAlert('Stock bought successfully.');
      this.resetModalDefaults();
    } catch (error) {
      console.error('Error during buy operation:', error);
      // Handle any errors that occurred during the operations
    }
  }

  async updateSell(totalCost: number, curPrice: number, quantity: number, ticker: string) {
    if (quantity <= 0) return;
  
    try {
      // Similar structure as updateBuy
      await this.updateWallet(Number(this.balance.balance) + totalCost);
      await this.updatePortfolio(totalCost, curPrice, quantity, ticker, false);
      this.fetchWatchlist();
      this.showAlert('Stock sold successfully.');
      this.resetModalDefaults();
    } catch (error) {
      console.error('Error during sell operation:', error);
      // Handle errors
    }
  }

  showAlert(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // Duration in milliseconds after which the snack-bar will auto-dismiss.
    });
  }


  updatePortfolio(totalCost: number, curPrice: number, quantity: number, ticker: string, isBuy: boolean): Promise<any> {
    return this.http.post<any>('http://localhost:3000/api/v1.0.0/portfolio', {
      ticker: ticker,
      totalCost: totalCost,
      curPrice: curPrice,
      quantity: quantity,
      isBuy: isBuy
    }).toPromise();
  }
  
  updateWallet(purchaseAmt: number): Promise<any> {
    
    return this.http.post<any>('http://localhost:3000/api/v1.0.0/walletupdate', {
      balance: String(purchaseAmt)
    }).toPromise();
  }
resetModalDefaults() {
  this.quantity = 0; // Reset quantity
  this.notEnoughMoney = false; // Reset any error states or other fields
  // Reset any other necessary fields in a similar manner
  this.totalCost = 0;
}

}
