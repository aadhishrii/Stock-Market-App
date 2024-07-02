import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent {
  @Input() ticker: string = '';
  news: any = null;
  selectedNewsItem: any;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    if (this.ticker) {
      this.fetchNews(this.ticker);
    }
  }

  fetchNews(tickerValue: string){
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/news/${tickerValue}`).subscribe(
      (response) => {
        console.log('News:', response);
        this.news = response;
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  shareOnFacebook(url: string): void {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookShareUrl, '_blank');
  }

  shareOnTwitter(url: string, text: string): void {
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(twitterShareUrl, '_blank');
  }
  
  // openNewsModal(newsItem: any): void {
  //   this.selectedNewsItem = newsItem;
  //   // Assuming you're using Bootstrap 5, the modal instance is handled like this:
  //   const modalElement = document.getElementById('staticBackdrop');
  //   const modalInstance = new bootstrap.Modal(modalElement);
  //   modalInstance.show();
  // }
  clearSearch():void{
    this.news= null;
    console.log('Cleared: ',this.ticker);
  }
}
