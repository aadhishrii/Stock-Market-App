import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import HC_exporting from 'highcharts/modules/exporting';
import HC_candlestick from 'highcharts/modules/stock';
// Import Highstock instead of Highcharts
import * as Highcharts from 'highcharts/highstock'
import more from 'highcharts/highcharts-more';
import indicators from 'highcharts/indicators/indicators';
import vbp from 'highcharts/indicators/volume-by-price';
indicators(Highcharts);
more(Highcharts);
vbp(Highcharts);
HC_exporting(Highcharts);
HC_candlestick(Highcharts);
@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnChanges {
  @Input() ticker: string = '';
  @Input() cleared: string = '';
  @Output() searchEvent: EventEmitter<string> = new EventEmitter<string>();
  metadata: any = null; 
  latestPrice: any = null;
  peers: any = null;
  @Input() childFunction!: () => void;
  chart: any = null;
  startDate: string = '';
  chartOptions: Highcharts.Options = {}; 
  Highcharts: typeof Highcharts = Highcharts; // Required
  daily_color: string = 'red';

  constructor(private http: HttpClient) { }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['cleared'].currentValue == 'CLEAR'){
      this.clearSearch()
    }
    if (changes['ticker'] && changes['ticker'].currentValue) {
      const tickerValue = changes['ticker'].currentValue;
      this.fetchMetadata(tickerValue);
      this.fetchLatestPrice(tickerValue);
      this.fetchPeers(tickerValue);
    }
  }


  fetchPeers(tickerValue: string){
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/peers/${tickerValue}`).subscribe(
      (response) => {
        console.log('Peers:', response);
        this.peers = response;
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  fetchMetadata(tickerValue: string) {
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/metadata/${tickerValue}`).subscribe(
      (response) => {
        console.log('Metadata:', response);
        this.metadata = response;
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
        // Handle the latest price response here, e.g., display it in the UI
        this.fetchDailyChart(tickerValue);
      },
      (error) => {
        console.error('Error fetching latest price:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }
  fetchDailyChart(tickerValue:string){
    this.startDate = this.latestPrice.t;
    console.log('Start Date',this.startDate);
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/dailycharts/${tickerValue}/date/${this.startDate}`).subscribe(
      (response) => {
        console.log('daily charts', response);
        this.chart = response;
        this.prepareChartData(response.results);
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );

    
  }

  prepareChartData(data: any) {
    if(this.latestPrice.d>0){
      this.daily_color = 'green';
    }
    if (!this.chart || !this.chart.results) {
      console.error('No chart data available');
      return;
    }
    interface ChartDataItem {
      v: number; // Volume
      vw: number; // Volume weighted average price
      o: number; // Open price
      c: number; // Close price
      h: number; // High price
      t: number; // Timestamp or any other date representation
    }
    const chartData = data.map((item: ChartDataItem) => {
      return {
        x: item.t, // You'll need to convert this to a JavaScript date
        y: item.c // Using the closing price for the y-axis
      };
    });
    this.chartOptions = {
      chart: {
        type: 'line' // Define the chart type
      },
      title: {
        text:  `${this.metadata?.ticker || 'Hourly Price Variation'}` // Title of the chart
      },
      xAxis: {
        type: 'datetime', // Since you're dealing with time, the x-axis should be of datetime type
        title: {
          text: 'Time'
        }
      },
      yAxis: {
        title: {
          text: 'Price (USD)' // Assuming the price is in USD
        }
      },
      series: [{
        type: 'line', // Specify the series type here
    name: this.metadata.ticker,
    data: chartData, // Make sure chartData is typed correctly
    color:this.daily_color,
    tooltip: {
      valueDecimals: 2
    }
      }],
      plotOptions: {
        line: {
          dataLabels: {
            enabled: false // Enabling data labels on the chart
          },
          enableMouseTracking: true // Enable mouse tracking for tooltip functionality
        }
      },
      credits: {
        enabled: false // Disabling the Highcharts watermark
      },
      exporting: {
        enabled: true // Allows users to export the chart (if you've added the exporting module)
      },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      }
    };
    
  }


  onPeerClick(peer: string) {
    // Emit event with the clicked peer
    // this.searchEvent.emit(peer);
    console.log(peer);
    // this.searchEvent.emit(peer);
  }

  clearSearch():void{
    this.metadata= null;
    this.latestPrice= null;
    this.peers= null;
    this.chart= null;
    console.log('Cleared: ',this.ticker);
  }
}

