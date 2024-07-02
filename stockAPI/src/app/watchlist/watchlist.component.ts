import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { WatchlistService } from '../watchlist.service'; // Adjust the path as needed
import { Subscription } from 'rxjs/internal/Subscription';
import { forkJoin, interval, timer } from 'rxjs';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {
  watchlist: any[] = [];
  tickerData: any[] = [];
  private refreshSubscription: Subscription = new Subscription();
  isLoadingWatchlist: boolean = true; // Start in the loading state
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchWatchlist();
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
        const index = this.tickerData.findIndex(item => item.ticker === tickerValue);
        // If the ticker data exists, update its metadata
        if (index !== -1) {
          this.tickerData[index].metadata = response;
        } else {
          // If the ticker data doesn't exist, create a new object and push it to the array
          this.tickerData.push({ ticker: tickerValue, metadata: response, latestPrice: null });
        }
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
        const index = this.tickerData.findIndex(item => item.ticker === tickerValue);
        // If the ticker data exists, update its latest price
        if (index !== -1) {
          this.tickerData[index].latestPrice = response;
        } else {
          // If the ticker data doesn't exist, create a new object and push it to the array
          this.tickerData.push({ ticker: tickerValue, metadata: null, latestPrice: response });
        }
      },
      (error) => {
        console.error('Error fetching latest price:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }
  fetchWatchlist(){
    const timer$ = timer(2000);
    // Create a timer observable that emits once after 3000ms (3 seconds)

  // Convert your HTTP request to an observable without subscribing immediately
  const fetchData$ = this.http.get<any>(`http://localhost:3000/api/v1.0.0/watchlist`);

  // Use forkJoin to wait for both the timer and the fetch data observable to complete
  forkJoin({ data: fetchData$, timer: timer$ }).subscribe({
    next: (result) => {
      console.log('Watchlist:', result.data);
      this.watchlist = result.data;
      this.isLoadingWatchlist = false;
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
      this.isLoadingWatchlist = false; // Stop loading
    }
  });
  }
  // fetchWatchlist(){
    
  //   this.http.get<any>(`http://localhost:3000/api/v1.0.0/watchlist`).subscribe(
  //     (response) => {
  //       console.log('Watchlist:', response);
  //       this.watchlist = response;
  //       this.isLoadingWatchlist = false;
  //       // Handle the metadata response here, e.g., display it in the UI
  //       // Iterate over each ticker in the watchlist and fetch metadata and latest price
  //       this.watchlist.forEach((item) => {
  //         this.fetchMetadata(item.ticker);
  //         this.fetchLatestPrice(item.ticker);
  //       });
  //     },
  //     (error) => {
  //       console.error('Error fetching watchlist:', error);
  //       // Handle errors, e.g., display an error message to the user
  //     }
  //   );
  // }
  deleteTicker(ticker: string): void {
    // Make HTTP request to delete ticker from the database
    this.http.delete<any>(`http://localhost:3000/api/v1.0.0/watchlist/${ticker}`).subscribe(
      () => {
        console.log(`Ticker ${ticker} deleted successfully.`);
        // After successful deletion, remove the ticker from the local data array
        this.tickerData = this.tickerData.filter(item => item.ticker !== ticker);
      },
      (error) => {
        console.error('Error deleting ticker:', error);
        // Handle error if deletion fails
      }
    );
  }

}

