const request = require('request-promise-native');
const { msg } = require('../utils/helpers');
const { getTokensByTeam } = require('./firebaseHandlers');

/**
 * Requires USERS.PROFILE scope in Slack app permissions
 * @param {string} userId
 * @param {string} teamId
 */
exports.getUserInfo = async (userId, teamId) => {
  const data = {
    token: (await getTokensByTeam(teamId)).botToken,
    user: userId,
  };
  return request
    .post('https://slack.com/api/users.info', { form: data })
    .then((res) => {
      const result = JSON.parse(res);
      if (result.ok === true) return result.user;
      console.log({ getUserInfoError: result.error });
    })
    .catch(console.log);
};

/**
 * Notofies user when their ticket is solved
 * REQUIRES chat:write, im:read, post, read scopes at
 * @param {string} userId
 * @param {string} message - Message text to send to the user
 */
exports.sendDM = async (userId, teamId, ticketNumber) => {
  const token = (await getTokensByTeam(teamId)).botToken;

  // Get ticket owner's direct message channel id
  const imList = await request.post('https://slack.com/api/im.list', {
    form: { token },
  });
  const userChannelId = JSON.parse(imList).ims.find(channel => channel.user === userId).id;

  request.post('https://slack.com/api/chat.postMessage', {
    form: {
      token,
      id: 'ticket-solved',
      as_user: false,
      text: msg.notify(ticketNumber),
      channel: userChannelId,
    },
  });
};

/**
 * @param {string} responseURL - received from slack messages
 * @param {string} message - Constructed response message with attachment
 */
exports.sendMessage = (responseURL, message) => {
  const options = {
    uri: responseURL,
    method: 'POST',
    headers: { 'Content-type': 'application-json' },
    json: message,
  };
  request(options).catch(console.log);
};
