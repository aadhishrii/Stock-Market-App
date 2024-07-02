import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';

// Define an interface to describe the structure of each recommendation item.
interface Recommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.css']
})
export class InsightsComponent implements OnInit{
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  @Input() ticker: string = '';
  insider: any = null;
  recommend: any = null;
  earning: any = null;
  tickerName: any = null;
  recommendChartOptions: Highcharts.Options = {}; // Options for the recommendation trends chart
  earningsChartOptions: Highcharts.Options = {};


  constructor(private http: HttpClient) { }

  ngOnInit() {
    if (this.ticker) {
      this.fetchRecommendation(this.ticker);
      this.fetchInsider(this.ticker);
      this.fetchEarning(this.ticker);
    }
  }

  fetchRecommendation(tickerValue: string){
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/recommendation/${tickerValue}`).subscribe(
      (response) => {
        console.log('Recommendation:', response);
        this.recommend = response;
        this.createChart(response);
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  fetchInsider(tickerValue: string){
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/insider/${tickerValue}`).subscribe(
      (response) => {
        console.log('Insider:', response);
        this.insider = response;
        this.tickerName = tickerValue;
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  fetchEarning(tickerValue: string){
    this.http.get<any>(`http://localhost:3000/api/v1.0.0/earnings/${tickerValue}`).subscribe(
      (response) => {
        console.log('Earnings:', response);
        this.earning = response;
        setTimeout(() => {
          this.createEarningsChart(this.earning);
        }, 0);
        // Handle the metadata response here, e.g., display it in the UI
      },
      (error) => {
        console.error('Error fetching peers:', error);
        // Handle errors, e.g., display an error message to the user
      }
    );
  }

  clearSearch():void{
    this.insider= null;
    this.recommend= null;
    console.log('Cleared: ',this.ticker);
  }
  createChart(data: any) {
    const series = this.processDataForChart(data);

    this.chartOptions = {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Recommendation Trends'
      },
      xAxis: {
        categories: data.map((item: { period: any; }) => item.period)
      },
      yAxis: {
        min: 0,
        title: {
          text: '# Analysts'
        }
      },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        shared: true
      },
      plotOptions: {
        column: {
          stacking: 'normal'
        }
      },
      series: series
    };
    
    // Required for changes to be detected
    Highcharts.chart('container', this.chartOptions);
  }

  processDataForChart(data: Recommendation[]): Highcharts.SeriesOptionsType[] {
    const categories = ['strongBuy', 'buy', 'hold', 'sell', 'strongSell'];
    const colors = ['#006400', '#90EE90', '#FFA500', '#FF7043', '#8B0000']; // Use your own color scheme

    return categories.map((category, index) => {
      return {
        type: 'column',
        name: category.replace(/([A-Z])/g, ' $1'), // Converts "strongBuy" to "Strong Buy"
        data: data.map(item => item[category as keyof Recommendation]),
        color: colors[index],
      };
    });
  }


  createEarningsChart(earningsData: any[]) {
    const actualSeriesData = earningsData.map(earning => {
      return {
        y: earning.actual,
        x: Date.parse(earning.period),
        marker: {
          symbol: 'circle'
        }
      };
    });
  
    const estimateSeriesData = earningsData.map(earning => {
      return {
        y: earning.estimate,
        x: Date.parse(earning.period),
        marker: {
          symbol: 'diamond'
        }
      };
    });
  
    this.earningsChartOptions = {
      chart: {
        type: 'spline' // or 'line' if you prefer straight lines between points
      },
      title: {
        text: 'Historical EPS Surprises'
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Date'
        }
      },
      yAxis: {
        title: {
          text: 'Quarterly EPS'
        }
      },
      series: [{
        type: 'spline', // Add type here
        name: 'Actual',
        data: actualSeriesData,
        color: '#ADD8E6' // blue for actual
      }, {
        type: 'spline', // Add type here
        name: 'Estimate',
        data: estimateSeriesData,
        color: '#800080' // same color, but you can change it if needed
      }],
      tooltip: {
        formatter: function() {
          const xValue = this.x as number;

    return 'Date: <b>' + Highcharts.dateFormat('%Y-%m-%d', xValue) + '</b><br/>' +
           this.series.name + ': <b>' + this.y + '</b><br/>' +
           'Surprise: <b>' + (this.point as any).surprise + '</b>';
        }
      }
    };
  
    // Required for changes to be detected
    Highcharts.chart('earningsChartContainer', this.earningsChartOptions); // Make sure you have a container with this ID in your HTML
  }
  

}
