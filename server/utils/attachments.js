const { msg, getTicketLists } = require('../utils/helpers');
const { examples } = require('../utils/constants');

/**
 * @param {bool} isAdmin - Admin status
 * @returns {object} formatted response object
 */
exports.usage = isAdmin => ({
  color: '#36a64f',
  mrkdwn_in: ['text'],
  title: msg.help.title,
  text: msg.help.att(isAdmin),
});

/**
 * @param {object}
 * @param {bool} object.isAdmin - Admin status
 * @param {string} object.userId
 * @param {string} object.teamId
 * @returns {object} formatted response object
 */
exports.show = ({ isAdmin, userId, teamId }) => {
  const promises = getTicketLists(userId, teamId, isAdmin);

  const base = {
    mrkdwn_in: ['pretext', 'text', 'fields'],
    color: '#36a64f',
  };

  return Promise.all(promises)
    .then(([solved, open]) => {
      const ticketsSolved = solved && Object.values(solved);
      const ticketsOpen = open && Object.values(open);

      // If no tickets found in database
      if (!ticketsOpen && !ticketsSolved) {
        return { ...base, text: msg.show.list.empty };
      }

      if (isAdmin) {
        return {
          ...base,
          pretext: examples.short.admin,
          fields: [
            ticketsSolved && {
              title: msg.show.title.adminSolved,
              value: msg.show.list.format(ticketsSolved),
            },
            {
              title: msg.show.title.adminOpen,
              value: ticketsOpen
                ? msg.show.list.format(ticketsOpen, isAdmin)
                : msg.show.list.noOpen,
            },
          ],
        };
      }
      return {
        ...base,
        pretext: examples.short.user,
        title: msg.show.title.userTitle,
        fields: [
          {
            title: msg.show.title.userSolved,
            value: ticketsSolved ? msg.show.list.format(ticketsSolved) : msg.show.list.noSolved,
          },
          {
            title: msg.show.title.userOpen,
            value: ticketsOpen ? msg.show.list.format(ticketsOpen) : msg.show.list.noOpen,
          },
        ],
      };
    })
    .catch(console.log);
};

/**
 * Response returned on cancelled action
 * @returns {object} formatted response object
 */
exports.helpOrShowInteractive = () => ({
  text: 'Cancelled',
  color: '#F4511E',
  mrkdwn_in: ['text', 'actions'],
  callback_id: 'helpOrShow',
  attachemnt_type: 'default',
  actions: [
    {
      name: 'HELP',
      text: 'Help',
      type: 'button',
      value: '',
    },
    {
      name: 'SHOW',
      text: msg.btn.view,
      type: 'button',
      value: '',
    },
  ],
});

/**
 * @param {object}
 * @param {string} command - Initial slash command
 * @param {object} ticket: {id, text, number} - Ticket referenced in a slash command
 * @param {bool} adminSelfSolve - if admin is solving his/her own ticket
 * @returns {object} formatted response object
 */
exports.confirm = (command, ticket, adminSelfSolve = false) => ({
  color: '#ffd740',
  text: adminSelfSolve ? msg.confirm.adminSelfSolve(ticket) : msg.confirm.text(command, ticket),
  mrkdwn_in: ['text', 'actions'],
  callback_id: `CONFIRM_${command}`,
  attachment_type: 'default',
  actions: [
    {
      name: 'CANCEL',
      text: msg.btn.no,
      style: 'danger',
      type: 'button',
      value: '',
    },
    {
      name: command,
      text: msg.btn.yes(command),
      type: 'button',
      value: JSON.stringify(ticket),
    },
    adminSelfSolve && {
      name: 'CLOSE',
      text: msg.btn.yes('CLOSE'),
      type: 'button',
      value: JSON.stringify(ticket),
    },
  ],
});
