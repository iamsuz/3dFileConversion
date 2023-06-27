const express = require('express')
const router = require('./routes/index');
let logger = require('morgan');
const app = express()
// const bodyParser = require('body-parser')
// const session = require('cookie-session')
let fileUpload = require('express-fileupload');
// Add a routers


// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// for file uploads
app.use(
    fileUpload({
      // useTempFiles: true,
      // tempFileDir: '/tmp/',
      debug: true,
    })
  );

app.get('/',(req,res)=>{
    res.send("<h2>Hello There adsufh  !!</h2>")
})

// add a file xlsx reader 

app.use(logger(`:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :: (time: :response-time ms)`));

app.use('/api', router);

const port = process.env.PORT || 3000

app.listen(port,()=> console.log(`listing on a ${port}`))
