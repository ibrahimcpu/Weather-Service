const express = require('express');
const app = express();
const router = require('./routes/route');
app.use('/', express.static('public'));
app.use(express.json());

//  Mounted Route path !!!
app.use('/api', router);


app.listen(3000, ()=>{
  process.stdout.write('Server running at: http://localhost:3000\n')
})