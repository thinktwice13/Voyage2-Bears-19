const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../dist')));

// Require routes
require('./api')(app);

const server = app.listen(PORT, () => {
  console.log(
    'Express server listening on port %d in %s mode',
    server.address().port,
    app.settings.env,
  );
});
