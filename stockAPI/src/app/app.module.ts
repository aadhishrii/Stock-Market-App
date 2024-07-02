import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DetailsComponent } from './details/details.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NewsComponent } from './news/news.component';
import { ChartsComponent } from './charts/charts.component';
import { InsightsComponent } from './insights/insights.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SearchComponent } from './search/search.component';
import { BuyPopupComponent } from './buy-popup/buy-popup.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { PortfolioComponent } from './portfolio/portfolio.component';
import { HighchartsChartModule } from 'highcharts-angular';



@NgModule({
  declarations: [
    AppComponent,
    DetailsComponent,
    NewsComponent,
    ChartsComponent,
    InsightsComponent,
    NavbarComponent,
    WatchlistComponent,
    SearchComponent,
    BuyPopupComponent,
    PortfolioComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    HighchartsChartModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
