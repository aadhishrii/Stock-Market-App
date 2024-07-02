const express = require('express');
const outerAPI = require('./outerAPI');
const cors = require('cors');
const app = express();

function ignoreFavicon(req, res, next) {
    if (req.originalUrl.includes('favicon.ico')) {
        res.status(204).end()
    }
    next();
}

function checkArray(priceRes, tickerName) {
    if (Array.isArray(priceRes)) {
        console.log(`${tickerName} Record length: ${priceRes.length}`);
    } else {
        console.log(`${tickerName} Ticker Not Found`);
    }
}

app.use(ignoreFavicon);
app.use(cors());

app.get('/', (req, res) => {
    return res.send('Stock Search by Aadhishrii Patiil');
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://aadhishrii:Amazon2000@cluster0.unqtvet.mongodb.net/?retryWrites=true&w=majority";
// const uri = "mongodb+srv://ashunitinholkar:Ashu1234@cluster0.jwxawwi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db; 
async function connectToMongo() {
    try {
      await client.connect();
      db = client.db("HW3");
      console.log("Successfully connected to MongoDB Atlas!");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      process.exit(1);
    }
  }
  
  connectToMongo();

app.get('/api/v1.0.0/searchutil/:keyword', async function (req, res) {
    console.log(`\nSearch-utilities Call: ${req.params.keyword}`);
    // if not found, response is [] with length 0
    let origRes = await outerAPI.getAutocomplete(req.params.keyword);
    let msg = `${req.params.keyword} Search-utilities finished at ${Date()}\nLength of response: ${origRes.length}`;
    console.log(origRes);
    return res.send(origRes);
    // if (origRes)
    //     return res.status(200).json(origRes);
})

// app.get('/api/v1.0.0/metadata/:tickerName', async function (req, res) {
//     console.log(`\nMeta Data Call: ${req.params.tickerName.toUpperCase()}`);
//     // if not found, response is {"detail":"Not found."}
//     let origRes = await outerAPI.getCompanyMetaData(req.params.tickerName);
//     console.log(`${req.params.tickerName.toUpperCase()} Meta Data finished at ${Date()}\n`);
//     return res.send(origRes);
//     // if (origRes)
//     //     return res.status(200).json(origRes);
// })

app.get('/api/v1.0.0/metadata/:tickerName', async function (req, res) {
    console.log(`\nMeta Data Call: ${req.params.tickerName.toUpperCase()}`);

    // Connect to the database
    // Assuming `db` is your MongoDB database instance
    const tickerExists = await db.collection('portfolio').findOne({ ticker: req.params.tickerName.toUpperCase() });
    const inWatchlist = await db.collection('watchlist').findOne({ticker:req.params.tickerName.toUpperCase()});
    // Check if the ticker exists in the database
    if (tickerExists) {
        // If ticker exists, fetch and return metadata with a flag
        let origRes = await outerAPI.getCompanyMetaData(req.params.tickerName);
        console.log(`${req.params.tickerName.toUpperCase()} Meta Data finished at ${Date()}\n`);
        
        // Add a boolean property to your response indicating the ticker exists
        origRes.existsInPortfolio = true; // Add this line
        if(inWatchlist){
            origRes.isWatchlist = true;
        }
        else{
            origRes.isWatchlist = false;
        }
        console.log('isinwatch',origRes.isWatchlist);
        
        return res.send(origRes);
    } else {
        // If ticker does not exist, you can decide how to handle this.
        // For example, you might still want to fetch the metadata but indicate the ticker doesn't exist in the portfolio
        let origRes = await outerAPI.getCompanyMetaData(req.params.tickerName);
        if (origRes.detail && origRes.detail === "Not found.") {
            // Handle case where outer API says metadata not found
            return res.status(404).send({detail: "Not found."});
        } else {
            if(inWatchlist){
                origRes.isWatchlist = true;
            }
            else{
                origRes.isWatchlist = false;
            }
            console.log('isinwatch',origRes.isWatchlist);
            // Ticker metadata was found but the ticker is not in the portfolio
            origRes.existsInPortfolio = false; // Indicate ticker doesn't exist in portfolio
            return res.send(origRes);
        }
    }
});

app.get('/api/v1.0.0/latestprice/:tickerName', async function (req, res) {
    console.log(`\nLatest Price Call: ${req.params.tickerName.toUpperCase()}`);
    
    let origRes = await outerAPI.getLatestPrice(req.params.tickerName);
    
    // Get the current time in the same format as origRes.t for comparison
    let currentTime = new Date().getTime();
    
    // Add marketOpen field based on the comparison
    if (origRes.t && origRes.t < currentTime) {
        origRes.marketOpen = false;
    } else {
        origRes.marketOpen = true;
    }

    console.log(`${req.params.tickerName.toUpperCase()} Latest Price finished at ${Date()}\n`);
    
    return res.send(origRes);
});



app.get('/api/v1.0.0/news/:keyword', async function (req, res) {
    console.log(`\nNews Call: ${req.params.keyword.toUpperCase()}`);
    // if error in fetch, response is null
    let origRes = await outerAPI.getNews(req.params.keyword);
    let msg = req.params.keyword.toUpperCase() + " News finished at " + Date();
    // if (origRes && origRes.length) {
    //     msg += "Length of response: " + origRes.length + "; First title length: " + origRes[0].headline.length + "\n";
    // } else {
    //     msg += "Null news.\n";
    // }
    // console.log(msg);
    return res.send(origRes);
    // if (origRes)
    //     return res.status(200).json(origRes);
})

app.get('/api/v1.0.0/insider/:tickerName', async function (req, res) {
    console.log(`\nInsider Sentiment Call: ${req.params.tickerName.toUpperCase()}`);
    // if not found, response is {"detail":"Not found."}
    let origRes = await outerAPI.getInsider(req.params.tickerName);
    console.log(`${req.params.tickerName.toUpperCase()} Latest Price finished at ${Date()}\n`);
    return res.send(origRes);
})

app.get('/api/v1.0.0/recommendation/:tickerName', async function (req, res) {
    console.log(`\nInsider Sentiment Call: ${req.params.tickerName.toUpperCase()}`);
    // if not found, response is {"detail":"Not found."}
    let origRes = await outerAPI.getRecommendation(req.params.tickerName);
    console.log(`${req.params.tickerName.toUpperCase()} Latest Price finished at ${Date()}\n`);
    return res.send(origRes);
})

app.get('/api/v1.0.0/peers/:tickerName', async function (req, res) {
    console.log(`\nInsider Sentiment Call: ${req.params.tickerName.toUpperCase()}`);
    // if not found, response is {"detail":"Not found."}
    let origRes = await outerAPI.getPeers(req.params.tickerName);
    console.log(`${req.params.tickerName.toUpperCase()} Latest Price finished at ${Date()}\n`);
    return res.send(origRes);
})

app.get('/api/v1.0.0/earnings/:tickerName', async function (req, res) {
    console.log(`\nDaily chart data Call: ${req.params.tickerName.toUpperCase()}; Start Date: ${req.params.startDate}`);
    // if not found, response is {"detail":"Not found."}
    let origRes = await outerAPI.getEstimate(req.params.startDate, req.params.tickerName);
    // checkArray(origRes, req.params.tickerName.toUpperCase());
    // console.log(`${req.params.tickerName.toUpperCase()} daily chart data finished at ${Date()}`);
    // console.log(origRes);
    return res.send(origRes);
    // if (origRes)
    //     return res.status(200).json(origRes);
})

app.get('/api/v1.0.0/dailycharts/:tickerName/date/:startDate', async function (req, res) {
    console.log(`\nDaily chart data Call: ${req.params.tickerName.toUpperCase()}; Start Date: ${req.params.startDate}`);
    // if not found, response is {"detail":"Not found."}
    let origRes = await outerAPI.getDailyChartData(req.params.startDate, req.params.tickerName);
    checkArray(origRes, req.params.tickerName.toUpperCase());
    console.log(`${req.params.tickerName.toUpperCase()} daily chart data finished at ${Date()}`);
    console.log('Daily',origRes);
    return res.send(origRes);
    // if (origRes)
    //     return res.status(200).json(origRes);
})

app.get('/api/v1.0.0/histcharts/:tickerName/date/:startDate', async function (req, res) {
    console.log(`\nHistorical chart data Call: ${req.params.tickerName.toUpperCase()}; Start Date: ${req.params.startDate}\n`);
    // if not found, response is object {"detail":"Error: Ticker 'xxxx' not found"}
    // otherwise response is array of object
    let origRes = await outerAPI.getHistChartsData(req.params.startDate, req.params.tickerName);
    checkArray(origRes, req.params.tickerName.toUpperCase());
    console.log(`${req.params.tickerName.toUpperCase()} Historical chart data finished at ${Date()}\n`);
    return res.send(origRes);
    // if (origRes)
    //     return res.status(200).json(origRes);
})

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://aadhishrii:Amazon2000@cluster0.unqtvet.mongodb.net/?retryWrites=true&w=majority";

// let db;

// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: ServerApiVersion.v1,
// });

// client.connect(err => {
//   if (err) {
//     console.error('Database connection failed', err);
//     process.exit();
//   }
//   db = client.db("HW3"); // Adjust "stockAPI" to your database name
//   console.log("Connected successfully to MongoDB Atlas");
// });

// Your existing app.use() calls...

// Add a stock to the watchlist
// app.post('/api/v1.0.0/watchlist', async (req, res) => {
//   const { ticker } = req.body;
//   if (!ticker) {
//     return res.status(400).send('Ticker is required');
//   }
//   try {
//     const result = await db.collection('watchlist').insertOne({ ticker });
//     res.status(201).send(result);
//   } catch (error) {
//     console.error('Error adding to watchlist:', error);
//     res.status(500).send(error);
//   }
// });

app.post('/api/v1.0.0/watchlistpost', express.json(), async (req, res) => {
    let client;
    // console.log('test');
    console.log('ticker',req.body.ticker);
    try {
        client = await MongoClient.connect(uri);
        const db = client.db('HW3');
        const collection = db.collection('watchlist');
        console.log("watchlist-name",req); // Assuming the data is sent as JSON
        // Check if the ticker already exists
        const existingTicker = await collection.findOne({ ticker: req.body.ticker });
        if (existingTicker) {
            // Ticker already exists in the database
            // res.status(400).json({ message: 'Ticker already exists in Watchlist' });
            const result = await collection.deleteOne({ ticker: req.body.ticker  });
            if (result.deletedCount === 1) {
                // Ticker deleted successfully
                return res.json({ message: 'Ticker deleted from Watchlist' });
            } else {
                // Failed to delete ticker
                return res.status(500).json({ error: 'Failed to delete ticker' });
            }
        } else {
            // Ticker does not exist, proceed with insertion
            const result = await collection.insertOne(req.body);
            res.json({ message: 'Stock added to Watchlist', result: result });
        }
        // const result = await collection.insertOne(req.body);
        // res.json({ message: 'Stock added to Watchlist', result: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        await client.close();
    }
});

// Get all stocks in the watchlist
app.get('/api/v1.0.0/watchlist', async (req, res) => {
    try {
        const client = await MongoClient.connect(uri);
        const db = client.db('HW3'); // Replace 'mydb' with your database name
        const collection = db.collection('watchlist'); // Replace 'posts' with your collection name
        const posts = await collection.find({}).toArray();
        client.close();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.delete('/api/v1.0.0/watchlist/:ticker', async (req, res) => {
    const client = await MongoClient.connect(uri);
    try {
        const db = client.db('HW3');
        const collection = db.collection('watchlist');
        const tickerToDelete = req.params.ticker;
        
        // Check if the ticker exists in the watchlist
        const existingTicker = await collection.findOne({ ticker: tickerToDelete });
        if (!existingTicker) {
            // Ticker does not exist in the watchlist
            return res.status(404).json({ message: 'Ticker not found in Watchlist' });
        }

        // Delete the ticker from the watchlist
        const result = await collection.deleteOne({ ticker: tickerToDelete });
        if (result.deletedCount === 1) {
            // Ticker deleted successfully
            return res.json({ message: 'Ticker deleted from Watchlist' });
        } else {
            // Failed to delete ticker
            return res.status(500).json({ error: 'Failed to delete ticker' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        await client.close();
    }
});


app.get('/api/v1.0.0/wallet', async (req, res) => {
    try {
        const client = await MongoClient.connect(uri);
        const db = client.db('HW3'); // Replace 'mydb' with your database name
        const collection = db.collection('wallet'); // Replace 'posts' with your collection name
        const money = await collection.find({}).toArray();
        money[0].balance = parseFloat(parseFloat(money[0].balance).toFixed(2));
        console.log("Money",money[0]);
        client.close();
        res.json(money[0]);
        
    } catch (err) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.post('/api/v1.0.0/walletupdate', express.json(), async (req, res) => {
    const client = await MongoClient.connect(uri);
    console.log('wallet update');
    try {
        const db = client.db('HW3');
        const collection = db.collection('wallet');

        // Delete all documents in the collection
        await collection.deleteMany({});

        // Insert the new document
        const result = await collection.insertOne(req.body);
        console.log('wallet update', req.body);
        res.json({ message: 'Wallet updated', result: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        await client.close();
    }
});

app.post('/api/v1.0.0/portfolio', express.json(), async (req, res) => {
    const client = await MongoClient.connect(uri);
    console.log('test');
    try {
        const db = client.db('HW3');
        const collection = db.collection('portfolio');
        // Check if the ticker already exists
        console.log("Portfolio",req.body);
        const existingTicker = await collection.findOne({ ticker: req.body.ticker });
        if (existingTicker) {
            // Ticker already exists in the database
            // console.log(existingTicker);
            if (req.body.isBuy){
                newCost = existingTicker.totalCost + req.body.totalCost;
                newQ = existingTicker.quantity + req.body.quantity;
                newCur = newCost/newQ;
                // console.log(newCost,newQ,newCur);
                const updatedFields = {
                    totalCost: newCost,
                    curPrice: newCur,
                    quantity: newQ
                    // Add other fields you want to update here
                };
                const result = await collection.updateOne(
                    { ticker: req.body.ticker },
                    { $set: updatedFields }
                );
                console.log('stock bought');
                res.json({ message: 'Stock bought', result: result });
            }
            else{
                const newQ = existingTicker.quantity - req.body.quantity;
                // If newQ is 0, delete the record instead of updating
                if (newQ === 0) {
                    await collection.deleteOne({ ticker: req.body.ticker });
                    console.log('Stock sold and removed from portfolio because quantity is 0');
                    res.json({ message: 'Stock sold and removed from portfolio' });
                } else {
                    const newCost = existingTicker.totalCost - (req.body.quantity * existingTicker.curPrice);
                    const newCur = newCost / newQ;
                    const updatedFields = {
                        totalCost: newCost,
                        curPrice: newCur,
                        quantity: newQ
                    };
                    await collection.updateOne({ ticker: req.body.ticker }, { $set: updatedFields });
                    console.log('Stock sold');
                    res.json({ message: 'Stock sold' });
                }
            }
            
        } else {
            // Ticker does not exist, proceed with insertion
            const result = await collection.insertOne(req.body);
            res.json({ message: 'Stock added to portfolio', result: result });
        }
        // const result = await collection.insertOne(req.body);
        // res.json({ message: 'Stock added to Watchlist', result: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        await client.close();
    }
});

// Get all stocks in the watchlist
app.get('/api/v1.0.0/portfolio', async (req, res) => {
    try {
        const client = await MongoClient.connect(uri);
        const db = client.db('HW3'); // Replace 'mydb' with your database name
        const collection = db.collection('portfolio'); // Replace 'posts' with your collection name
        const posts = await collection.find({}).toArray();
        client.close();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Listen to the App Engine-specified port, or 3000 otherwise
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NodeJS Stock Server listening on port ${PORT}...`);
});


