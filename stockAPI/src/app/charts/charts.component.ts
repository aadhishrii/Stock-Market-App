import { Component, Input } from '@angular/core';
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
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent {
  @Input() ticker: string = '';
  chart: any = null;
  startDate: string = '';
  Highcharts: typeof Highcharts = Highcharts; // Required
  histChartOptions: Highcharts.Options = {}; 
  today = new Date();

  constructor(private http: HttpClient) { }

  ngOnInit() {
    if (this.ticker) {
      this.fetchChartData(this.ticker);
    }
  }
  private formatDateToISOString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  fetchChartData(tickerValue: string){
    this.startDate = this.formatDateToISOString(this.today);
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/histcharts/${tickerValue}/date/${this.startDate}`).subscribe(
      (response) => {
        console.log('News:', response);
        this.chart = response;
        this.createHistCharts();
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  createHistCharts() {
    if (!this.chart || !this.chart.results) {
      console.error('No chart data available');
      return;
    }
  
    let ohlc = [];
    let volume = [];
    let dataLength = this.chart.results.length;
  
    for (let i = 0; i < dataLength; i++) {
      let data = this.chart.results[i];
      let timestamp = data.t; // If your backend returns timestamps in milliseconds, no need for Date.parse()
  
      ohlc.push([
        timestamp, // the date
        data.o, // open
        data.h, // high
        data.l, // low
        data.c, // close
      ]);
  
      volume.push([
        timestamp, // the date
        data.v, // the volume
      ]);
    }
    // console.log("Chart Data",ohlc);

    this.histChartOptions = {
      series: [
        {
          type: 'candlestick',
          name: this.ticker.toUpperCase(),
          id: this.ticker,
          zIndex: 2,
          data: ohlc,
        },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: volume,
          yAxis: 1,
        },
        {
          type: 'vbp',
          linkedTo: this.ticker,
          params: {
            volumeSeriesID: 'volume',
          },
          dataLabels: {
            enabled: false,
          },
          zoneLines: {
            enabled: false,
          },
        },
        {
          type: 'sma',
          linkedTo: this.ticker,
          zIndex: 1,
          marker: {
            enabled: false,
          },
        },
      ],
      title: { text: this.ticker.toUpperCase() + ' Historical' },
      subtitle: {
        text: 'With SMA and Volume by Price technical indicators',
      },
      yAxis: [
        {
          startOnTick: false,
          endOnTick: false,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'OHLC',
          },
          height: '60%',
          lineWidth: 2,
          resize: {
            enabled: true,
          },
        },
        {
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'Volume',
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
        },
      ],
      tooltip: {
        split: true,
      },
      plotOptions: {
        // series: {
        //   dataGrouping: {
        //     units: groupingUnits,
        //   },
        // },
      },
      rangeSelector: {
        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1m',
          },
          {
            type: 'month',
            count: 3,
            text: '3m',
          },
          {
            type: 'month',
            count: 6,
            text: '6m',
          },
          {
            type: 'ytd',
            text: 'YTD',
          },
          {
            type: 'year',
            count: 1,
            text: '1y',
          },
          {
            type: 'all',
            text: 'All',
          },
        ],
        selected: 2,
      },
      time: {
        getTimezoneOffset: function (timestamp) {
          var zoneDate = new Date(timestamp),
            timezoneOffset = -zoneDate.getTimezoneOffset(); // For LA or whatever timezone you need
          return timezoneOffset;
        }
      },
    }; // required
  }

  clearSearch():void{
    this.chart= null;
    console.log('Cleared: ',this.ticker);
  }
}
