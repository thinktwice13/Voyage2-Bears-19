const attach = require('./attachments');
const fb = require('../handlers/firebaseHandlers');
const { newStatus } = require('../utils/constants');
const { msg } = require('../utils/helpers');
const { sendDM } = require('../handlers/slackApiHandlers');

/**
 * Message responses based on intial slash commands or interactive messages
 * @param {object} responseParams from handleSlashCommand OR handleInteractiveMsg
 * @param {bool} object.isAdmim - Admin status of a user
 * @param {string} obj.command - Initial slash command OR interactive button command
 * @param {object} obj.ticket - An existing ticket referenced in a slash command OR a new ticket from OPEN slash command
 * @param {string} obj.userId
 * @param {string} obj.teamId
 * @param {object} obj.ticket
 */

// Show open and/or pending tickets and usage instructions
exports.HELLO = async ({ isAdmin }) => ({
  mrkdwn_in: ['text', 'attachments'],
  text: msg.hello.text,
  attachments: [attach.usage(isAdmin)],
});

// Show usage instructions
exports.HELP = ({ isAdmin }) => ({
  mrkdwn_in: ['text', 'attachments'],
  text: msg.help.text,
  attachments: [attach.usage(isAdmin)],
});

// Show open tickets to admins and open/solved to users
exports.SHOW = async params => ({
  attachments: [await attach.show(params)],
});

// Response to unrecognized inputs
exports.ERROR = ({ isAdmin }) => ({
  text: msg.error.text,
  mrkdwn_in: ['text', 'attachments'],
  attachments: [attach.usage(isAdmin)],
});

// INITIAL SLASH COMMAND RESPONSES

exports.OPEN = async ({ command, ticket }) => ({
  attachments: [attach.confirm(command, ticket)],
});

exports.CLOSE = async ({
  isAdmin, command, userId, ticket,
}) => {
  if (!isAdmin && ticket.author === userId && ticket.status !== 'closed') {
    return { attachments: [attach.confirm(command, ticket)] };
  } else if (ticket.status === 'closed') {
    return { text: msg.error.closed(ticket.number) };
  }
  return { text: msg.error.notAllowed, attachments: [attach.usage(isAdmin)] };
};

exports.SOLVE = async ({
  isAdmin, command, ticket, teamId,
}) => {
  if (ticket.team !== teamId) {
    return { text: msg.error.badTeam(ticket.number) };
  } else if (ticket.status !== 'open') {
    return { text: msg.error.notAllowedStatus(ticket) };
  } else if (isAdmin) {
    return { attachments: [attach.confirm(command, ticket)] };
  }
  return { text: msg.error.notAllowed, attachments: [attach.usage(isAdmin)] };
};

exports.UNSOLVE = async ({
  isAdmin, command, ticket, teamId,
}) => {
  if (ticket.team !== teamId) {
    return { text: msg.error.badTeam(ticket.number) };
  } else if (ticket.status !== 'solved') {
    return { text: msg.error.notAllowedStatus(ticket) };
  } else if (!isAdmin) {
    return { attachments: [attach.confirm(command, ticket)] };
  }
  return { text: msg.error.notAllowed, attachments: [attach.usage(isAdmin)] };
};

// CANCEL ACTION

exports.CANCEL = ({ isAdmin }) => ({
  attachments: [attach.helpOrShowInteractive(isAdmin, 'Cancelled.')],
});

// CONFIRM ACTION

exports.CONFIRM = async ({
  isAdmin,
  command,
  userId,
  teamId,
  username,
  ticket: {
    text, id, author, number,
  },
}) => {
  let message = '';
  if (command === 'OPEN') {
    const num = await fb.addNewTicket({
      userId,
      teamId,
      username,
      text: text.charAt(0).toUpperCase() + text.slice(1), // uppercase first letter
      isAdmin,
    });
    message = msg.confirm.submit(num, text);
  } else {
    await fb.updateTicket(id, author, teamId, newStatus[command]);
    message = msg.confirm.newStatus(number, command);
    if (command === 'SOLVE') sendDM(author, userId, teamId, number, text);
  }

  return {
    text: message,
    mrkdwn_in: ['text'],
  };
};
