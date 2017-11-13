const request = require('request');
const path = require('path');
const { setTokens } = require('../handlers/firebaseHandlers');

module.exports = (app) => {
  app.get('/slack', (req, res) => {
    if (!req.query.code) {
      // access denied
      res.redirect('/');
      return;
    }
    const data = {
      form: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_SECRET,
        code: req.query.code,
      },
    };
    // Exchnge temporary code fro access tokens
    request.post('https://slack.com/api/oauth.access', data, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const { team_id, access_token, bot: { bot_access_token } } = JSON.parse(body);
        // Save user's access tokens to database
        setTokens(team_id, access_token, bot_access_token);
        res.redirect('/success.html');
      }
    });
  });

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
  });
  app.get('/success.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'success.html'));
  });
};
