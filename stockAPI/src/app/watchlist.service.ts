import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private watchlistUrl = 'http://localhost:3000/api/v1.0.0/watchlist'; // URL to your API endpoint

  constructor(private http: HttpClient) { }

  getWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(this.watchlistUrl);
  }
}