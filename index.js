let express = require('express');
let path = require('path');
let logger = require('morgan');
let bodyParser = require('body-parser');
// let nunjucks = require('nunjucks');
// let session = require('express-session');
let fileUpload = require('express-fileupload');
// require('./controller/listeners')
const router = require('./routes');
const { serverAdapter } = require('./functions/queueProducer');
// const { serverAdapter } = require('./functions/bullQueue');
require('dotenv').config();
// let authFunc = require("./functions/authFunc");
// let authMiddleware = require("./middlewares/auth")
// let config = require('./config/config');

console.log(process.env.API)

let app = express();

app.get('/healthz', function (req, res) {
  res.status(200).send('OK');
});

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev')); // normally in dev
// app.use(logger('combined')); // in prod

// or a bit of both
app.use(
  logger(
    `:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :: (time: :response-time ms)`
  )
);

// X-USER-TYPE header is used by all the clients to see what user is hitting the request

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// for file uploads
app.use(
  fileUpload({
    // useTempFiles: true,
    // tempFileDir: '/tmp/',
    debug: true,
  })
);

app.use('/admin', serverAdapter.getRouter());

// app.use("/admin", serverAdapter.getRouter());
app.use('/api/v1', router);
// nunjucks.configure('views', {
//   autoescape: true,
//   express: app,
// });

// Add the postgres or the mongoose middleware as well for session management.
// MongoDB backend: https://www.npmjs.com/package/connect-mongodb-session
// Sequelize Backend: https://www.npmjs.com/package/connect-session-sequelize
// Postgres Backend: https://www.npmjs.com/package/connect-pg-simple

// For other options: https://github.com/expressjs/session#compatible-session-stores

// app.use(session({
//   secret: config.sessionKey,
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }
// }))

app.use(function (req, res, next) {
  const allowedOrigins = ['http://localhost:3000', 'https://virtu-api.app.fountane.com', 'https://api.virtu3d.io', 'http://localhost:3020']; // Replace with your allowed domains
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    // Allow requests from the specified origins
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Deny requests from all other origins
    res.header('Access-Control-Allow-Origin', 'null');
  }

  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-AUTH-TOKEN, X-USER-TYPE, REQUEST-ID');

  if (req.method == 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, HEAD');
    res.header('Access-Control-Max-Age', '1728000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-AUTH-TOKEN, X-USER-TYPE, REQUEST-ID');
    res.header('Content-Length', '0');
    res.sendStatus(208);
  } else {
    next();
    // Google Analytics logging or other middleware logic can come here
  }
});







app.get('/', function (req, res) {
  console.log('Welcome to the app');
  res.status(200).json({
    success: true,
    message: 'Welcome to the boilerplate api. Please login to continue ',
  });
});




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  // console.log(err);
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  if (err.status != 404) {
    console.log(err);
    res.status(500).json({ success: false, error: err });
  } else if (err.status == 404) {
    res.status(404).json({
      success: false,
      status: 404,
      message: 'Endpoint not found',
    });
  } else {
    res
      .status(200)
      .json({ success: true, message: 'Welcome to the Compression/Conversion server. Please register yourself to get an access token.' });
  }
});

app.listen(3020, () => {
  console.log('\n\n\n Compression Conversion Server is listening in port 3020 \n\n\n')
})
