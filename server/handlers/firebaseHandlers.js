const firebase = require('firebase');
require('../../config/firebase');

/**
 * Remove all ticket
 */
exports.removeAllTickets = async () =>
  firebase
    .database()
    .ref('tickets/')
    .remove();

/**
 * Increase ticket count
 * @param {string} teamId
 * @returns {number} new team count number
 */
const ticketIncrement = async teamId =>
  firebase
    .database()
    .ref(`tickets/${teamId}`)
    .child('count')
    .transaction(curr => (curr || 0) + 1)
    .then(({ snapshot }) => snapshot.val());

/**
 * Add new ticket
 * @param {any} userId
 * @param {any} teamId
 * @param {any} text
 * @returns {number} number - Assigned ticket number
 */
exports.addNewTicket = async ({ userId, teamId, text }) => {
  const number = await ticketIncrement(teamId);
  firebase
    .database()
    .ref(`tickets/${teamId}`)
    .push()
    .set({
      number,
      text,
      status: 'open',
      author: userId,
      author_status: `${userId}_open`,
      team: teamId,
    });
  return number;
};

/**
 * Get all open tickets based on userId
 * @param {string} userId
 * @param {string} teamId
 * @returns {object} collection of tickets
 */
exports.getAllOpenTicketsByUser = async (userId, teamId) => {
  const tickets = firebase.database().ref(`tickets/${teamId}`);
  const values = await tickets
    .orderByChild('author_status')
    .equalTo(`${userId}_open`)
    .once('value');
  return values.val();
};

/**
 * Get all open tickets based on userId
 *
 * @param {string} userId
 * @param {string} teamId
 * @returns {object} collection of tickets
 */
exports.getAllSolvedTicketsByUser = async (userId, teamId) => {
  const tickets = firebase.database().ref(`tickets/${teamId}`);
  const values = await tickets
    .orderByChild('author_status')
    .equalTo(`${userId}_solved`)
    .once('value');
  return values.val();
};

/**
 * Get all open tickets based on teamId
 * @param {string} teamId
 * @returns {object} collection of tickets
 */
exports.getAllOpenTicketsByTeam = async (teamId) => {
  const tickets = firebase.database().ref(`tickets/${teamId}`);
  const values = await tickets
    .orderByChild('status')
    .equalTo('open')
    .once('value');
  return values.val();
};

/**
 * Get a specific ticket based on number
 * @param {any} number
 * @param {string} teamId
 * @returns {object} ticket
 */
exports.getTicketByNumber = async (num, teamId) => {
  const tickets = firebase.database().ref(`tickets/${teamId}`);
  const values = await tickets
    .orderByChild('number')
    .equalTo(num)
    .once('value');
  return values.val();
};

/**
 * Update ticket status
 * @param {string} ticketId
 * @param {string} authorId
 * @param {string} teamId
 * @param {string} newStatus
 * @returns {object} ticket
 */
exports.updateTicket = async (ticketId, authorId, teamId, newStatus) => {
  const ticketRef = firebase.database().ref(`tickets/${teamId}/${ticketId}`);
  ticketRef.update({
    status: newStatus,
    author_status: `${authorId}_${newStatus}`,
  });
  const values = await ticketRef.once('value');
  return values.val();
};

/**
 * Save access token
 * @param {string} teamId
 * @param {string} accessToken
 * @param {string} botToken
 */
exports.setTokens = async (teamId, accessToken, botToken) =>
  firebase
    .database()
    .ref('tokens')
    .child(teamId)
    .set({ accessToken, botToken });

/**
 * Get team's access tokens
 * @param {string} teamId
 * @returns {object} saved team tokens
 */
exports.getTokensByTeam = async (teamId) => {
  const ref = firebase.database().ref(`tokens/${teamId}`);
  const values = await ref.once('value');
  return values.val();
};
