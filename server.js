const express = require('express');
const Expresso = express();
module.exports = Expresso;
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const morgan = require('morgan');

const PORT = process.env.PORT || 4000;




// Middleware to parse incoming request bodies
Expresso.use(bodyParser.json());
Expresso.use(bodyParser.urlencoded({ extended: true }));

// Middleware to enable CORS (Cross-Origin Resource Sharing)
Expresso.use(cors());

// Middleware for logging HTTP requests
Expresso.use(morgan('dev'));

// Middleware for handling errors
Expresso.use(errorHandler());


const apiRouter = require('./src/api/api');
Expresso.use('/api', apiRouter);


// Start the server
Expresso.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});