import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  selectedTab: string = 'search';

  showWatchlist(){
    console.log("clicked on watchlist");
    this.selectedTab = 'watchlist';
  }
  showSearch(){
    console.log("clicked on search");
    this.selectedTab = 'search';
  }
  showPortfolio(){
    console.log("clicked on portfolio");
    this.selectedTab = 'portfolio';
  }


}
