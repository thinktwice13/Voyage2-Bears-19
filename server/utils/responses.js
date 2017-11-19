const attach = require('./attachments');
const fb = require('../handlers/firebaseHandlers');
const { newStatus } = require('../utils/constants');
const { msg } = require('../utils/helpers');
const slackApi = require('../handlers/slackApiHandlers');

// INITIAL SLASH COMMAND RESPONSES

/**
 * Show open and/or pending tickets and usage instructions
 * @param {object} {isAdmin} Admin status
 * @returns {object} Composed response mesage
 */
exports.HELLO = ({ isAdmin }) => ({
  mrkdwn_in: ['text', 'attachments'],
  text: msg.hello.text,
  attachments: [attach.usage(isAdmin)],
});

/**
 * Show usage instructions
 * @param {object} {isAdmin} Admin status
 * @returns {object} Composed response mesage
 */
exports.HELP = ({ isAdmin }) => ({
  mrkdwn_in: ['text', 'attachments'],
  text: msg.help.text,
  attachments: [attach.usage(isAdmin)],
});

/**
 * Show open tickets to admins and open/solved to users
 * @param {object} {isAdmin} Admin status
 * @returns {object} Composed response mesage
 */
exports.SHOW = async params => ({
  attachments: [await attach.show(params)],
});

/**
 * Response to unrecognized inputs
 * @param {object} {isAdmin} admin status
 * @returns {object} Composed response mesage
 */
exports.ERROR = ({ isAdmin }) => ({
  text: msg.error.text,
  mrkdwn_in: ['text', 'attachments'],
  attachments: [attach.usage(isAdmin)],
});

/**
 * @param {object}
 * @param {string} object.command
 * @param {object} object.ticket
 * @returns {object} Composed response mesage
 */
exports.OPEN = ({ command, ticket }) => ({
  attachments: [attach.confirm(command, ticket)],
});

/**
 * @param {object}
 * @returns {object} Composed response mesage
 */
exports.SOLVE = ({
  isAdmin,
  command,
  userId,
  ticket,
  ticket: {
    number, team, status, author,
  },
}) => {
  if (!isAdmin) {
    return { text: msg.error.notAllowed, attachments: [attach.usage(isAdmin)] };
  } else if (!team) {
    return { text: msg.error.badTeam(number) };
  } else if (status !== 'open') {
    return { text: msg.error.notAllowedStatus(ticket) };
  }
  return { attachments: [attach.confirm(command, ticket, userId === author)] };
};

/**
 * @param {object}
 * @returns {object} Composed response mesage
 */
exports.UNSOLVE = ({
  command, userId, ticket, ticket: {
    number, author, status, team,
  },
}) => {
  if (!team) {
    return { text: msg.error.badTeam(number) };
  } else if (status !== 'solved') {
    return { text: msg.error.notAllowedStatus(ticket) };
  } else if (author !== userId) {
    return { text: msg.error.notAuthor(number) };
  }
  return { attachments: [attach.confirm(command, ticket)] };
};

/**
 * @param {object}
 * @returns {object} Composed response mesage
 */
exports.CLOSE = ({
  command, userId, ticket, ticket: {
    number, author, status, team,
  },
}) => {
  if (!team) {
    return { text: msg.error.badTeam(number) };
  } else if (status === 'closed') {
    return { text: msg.error.closed(number) };
  } else if (author !== userId) {
    return { text: msg.error.notAuthor(number) };
  }
  return { attachments: [attach.confirm(command, ticket)] };
};

// INTERACTIVE ACTIONS RESPONSES

/**
 * @returns {object} Composed response mesage
 */
exports.CANCEL = () => ({
  attachments: [attach.helpOrShowInteractive()],
});

/**
 * @param {object}
 * @returns {object} Composed response mesage
 */
exports.CONFIRM = async ({
  command, userId, teamId, ticket: {
    text, id, author, number,
  },
}) => {
  let message = '';
  if (command === 'OPEN') {
    text = text.charAt(0).toUpperCase() + text.slice(1); // uppercase first letter
    const num = await fb.addNewTicket({
      userId,
      teamId,
      text,
    });
    message = msg.confirm.submit(num, text);
  } else {
    const status = newStatus[command];
    await fb.updateTicket(id, author, teamId, status);
    message = msg.confirm.newStatus(number, status);
    if (command === 'SOLVE' && author !== userId) {
      slackApi.sendDM(author, userId, teamId, number, text);
    }
  }

  return {
    text: message,
    mrkdwn_in: ['text'],
  };
};
