// http://localhost:3000/api/v1.0.0/metadata/AAPL

const fetch = require('node-fetch');
const async = require('express-async-await');
const url = require('url');
const https = require('https');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');  // proxy is needed when local developing using VPN to access news API
// export http_proxy=http://127.0.0.1:1087;export https_proxy=http://127.0.0.1:1087;

// const tiingoAPIkey = 'be37d86b75ad931e483aaab61f620653921a7517';
const tiingoAPIkey = 'cmuok39r01qltmc13bp0cmuok39r01qltmc13bpg';
// const tiingoAPIkey = 'dea471cb1109196d1921d429284606624f433067';
const newsAPIkey = '166945ff132b43c2a1a395898628ab48';
// const newsAPIkey = '83d88b3f4f9d44ccad89772a6ef0e218';  // candidate key
const polygonAPIKey = 'gBin_P72Qze8bZDYLJ9IyX1Ab2p6q6lx';

module.exports.getAutocomplete = getAutocomplete;
module.exports.getCompanyMetaData = getCompanyMetaData;
module.exports.getLatestPrice = getLatestPrice;
module.exports.getInsider = getInsider;
module.exports.getRecommendation = getRecommendation;
module.exports.getPeers = getPeers;
module.exports.getNews = getNews;
module.exports.getDailyChartData = getDailyChartData;
module.exports.getHistChartsData = getHistChartsData;
module.exports.getEstimate = getEstimate;

// Function to format a date to "YYYY-MM-DD"
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatNumber(number) {
    let formattedNumber = parseFloat(number.toFixed(2)).toString();
    // Remove trailing zeros after the decimal point
    formattedNumber = formattedNumber.replace(/(\.[0-9]*[1-9])0+$/, "$1");
    // Remove the decimal point if it's followed by 00
    formattedNumber = formattedNumber.replace(/\.$/, "");
    return formattedNumber;
}

function subtractMonths(date, months) {
    var d = date.getDate();
    date.setMonth(date.getMonth() - months);
    if (date.getDate() != d) {
        date.setDate(0);
    }
    return date;
}

function calculateStartDate(endDateStr) {
    // Convert the end date string to a Date object
    const endDate = new Date(endDateStr);
  
    // Subtract 6 months from the end date
    const startDate = subtractMonths(endDate, 6);
  
    // Subtract 1 day from the start date
    startDate.setDate(startDate.getDate() - 1);
  
    // Convert the start date to a YYYY-MM-DD string
    const startDateStr = startDate.toISOString().split('T')[0];
  
    return startDateStr;
}
  

async function getAutocomplete(keyword) {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(keyword)}&token=${tiingoAPIkey}`;
    try {
        const APIres = await fetch(url);
        const searchRes = await APIres.json();
        // Filter results based on type and symbol
        const filteredResults = searchRes.result.filter(item => item.type === 'Common Stock' && !item.symbol.includes('.'));
        return filteredResults;
    } catch (error) {
        console.error("Error fetching autocomplete data:", error);
        return []; // Return an empty array in case of an error
    }
}


async function getCompanyMetaData(tickerName) {
    // table 4.1 content: Company’s Meta Data API call
    const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${tickerName}&token=${tiingoAPIkey}`);
    // let url = `https://finnhub.io/api/v1/stock/profile2/symbol=${tickerName}?token=${tiingoAPIkey}`;
    // let headers = {'Content-Type': 'application/json'};
    // let APIres = await fetch(url, {method: 'GET', headers: headers});
    // let metaDataRes = await APIres.json();
    return response.data;
}

async function getLatestPrice(tickerName) {
    // table 4.2 content: Company’s Latest Price of the Stock
    const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${tickerName}&token=${tiingoAPIkey}`);
    // let url = `https://finnhub.io/api/v1/quote?symbol=${tickerName}&token=${tiingoAPIkey}`;
    // let headers = {'Content-Type': 'application/json'};
    // let APIres = await fetch(url, {method: 'GET', headers: headers});
    // let latestPriceRes = await APIres.json();
    if (response.length === 0) {
        return {"detail": "Not found."};
    } else {
        return response.data;
    }

}

async function getRecommendation(tickerName) {
    // table 4.2 content: Company’s Latest Price of the Stock
    const response = await axios.get(`https://finnhub.io/api/v1/stock/recommendation?symbol=${tickerName}&token=${tiingoAPIkey}`);
    if (response.length === 0) {
        return {"detail": "Not found."};
    } else {
        return response.data;
    }

}

async function getPeers(tickerName) {
    // table 4.2 content: Company’s Latest Price of the Stock
    const response = await axios.get(`https://finnhub.io/api/v1/stock/peers?symbol=${tickerName}&token=${tiingoAPIkey}`);
    if (response.length === 0) {
        return {"detail": "Not found."};
    } else {
        console.log(response.data);
        return response.data;
    }

}

async function getInsider(tickerName) {
    
    const response = await axios.get(`https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${tickerName}&from=2022-01-01 &token=${tiingoAPIkey}`);
    if (response.data.length === 0) {
        return { "detail": "Not found." };
    } else {
        // console.log(response.data.data);
        // Initialize variables to hold aggregate values
        let positiveChange = 0;
        let negativeChange = 0;
        let totalChange = 0;
        let positivemspr = 0;
        let negativemspr = 0;
        let msprAggregate = 0;

        // Loop through the response data to calculate aggregates
        response.data.data.forEach(item => {
            if (item.change > 0) {
                positiveChange += item.change;
            } else {
                negativeChange += item.change;
            }
            if (item.mspr > 0){
                positivemspr += item.mspr;
            } else {
                negativemspr += item.mspr;
            }
        });
        totalChange = positiveChange + negativeChange;
        msprAggregate = positivemspr + negativemspr;

        // Return the aggregate values
        return {
            "positiveChange": positiveChange,
            "negativeChange": negativeChange,
            "totalChange": totalChange,
            "positivemspr": formatNumber(positivemspr),
            "negativemspr": formatNumber(negativemspr),
            "msprAggregate": formatNumber(msprAggregate)
        };
    }

}

// https://finnhub.io/api/v1/company-news?symbol=<TICKER>&from=<DATE>&to=<DA TE>&token=<API_KEY>
async function getNews(keyword) {
    // Get today's date
    const today = new Date();

    // Get the date one week before today's date
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Format both dates
    const todayFormatted = formatDate(today);
    const oneWeekAgoFormatted = formatDate(oneWeekAgo);

    // console.log('Today:', todayFormatted);
    // console.log('One week ago:', oneWeekAgoFormatted);
    try {
        const response = await axios.get(`https://finnhub.io/api/v1/company-news?symbol=${keyword}&from=${oneWeekAgoFormatted}&to=${todayFormatted}&token=${tiingoAPIkey}`);
        
        // Filter out news items without an image URL
        const newsWithImages = response.data.filter(newsItem => newsItem.image);

        const sliceLength = Math.min(newsWithImages.length, 20);
        let first = Object.entries(newsWithImages).slice(0, sliceLength);
        // console.log('News with images:', first);
        return first;
    } catch (error) {
        console.error('Error fetching news:', error);
        throw error; // Or handle the error as needed
    }
}

async function getDailyChartData(startDate, tickerName) {
    // Current Date as the end date
  let endDateObj = new Date();
  // Convert end date to 'YYYY-MM-DD' format
  let endDate = endDateObj.toISOString().split('T')[0];

  // Start Date is 24 hours before the end date
  let startDateObj = new Date(endDateObj.getTime());
  startDateObj.setDate(startDateObj.getDate() - 1);
  // Convert start date to 'YYYY-MM-DD' format
  startDate = startDateObj.toISOString().split('T')[0];
    console.log('start',startDate,'end',endDate);
    let url = `https://api.polygon.io/v2/aggs/ticker/${tickerName}/range/5/hour/${startDate}/${endDate}?adjusted=true&sort=asc&apiKey=${polygonAPIKey}`;
    let headers = {'Content-Type': 'application/json'};
    let APIres = await fetch(url, {method: 'GET', headers: headers});
    let dailyPriceRes = await APIres.json();
    return dailyPriceRes;
}

async function getEstimate(startDate, tickerName) {
    const response = await axios.get(`https://finnhub.io/api/v1/stock/earnings?symbol=${tickerName}&token=${tiingoAPIkey}`);
    if (response.length === 0) {
        return {"detail": "Not found."};
    } else {
        // console.log('Earning',response.data);
        return response.data;
    }
    // return estimate;
}

async function getHistChartsData(startDate, tickerName) {
    // Company’s Historical data in the last 2 years
    let endDate = calculateStartDate(startDate);
    console.log('start:',startDate,'end',endDate);
    let url = `https://api.polygon.io/v2/aggs/ticker/${tickerName}/range/1/day/${endDate}/${startDate}?adjusted=true&sort=asc&apiKey=${polygonAPIKey}`
    // let url = `https://api.tiingo.com/tiingo/daily/${tickerName}/prices?startDate=${startDate}&resampleFreq=daily&token=${tiingoAPIkey}`;
    let headers = {'Content-Type': 'application/json'};
    let APIres = await fetch(url, {method: 'GET', headers: headers});
    let histRes = await APIres.json();
    // console.log('HistData',histRes);
    return histRes;
}
