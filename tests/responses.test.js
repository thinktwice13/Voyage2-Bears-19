require('dotenv').load({ path: '.env.test' });
const fb = require('../server/handlers/firebaseHandlers');
const res = require('../server/utils/responses');
const help = require('../server/utils/helpers');
const slackApi = require('../server/handlers/slackApiHandlers');

const { msg } = help;

// Params
let prm = {
  userId: 'user1',
  teamId: 'team1',
  text: 'text1',
};

beforeAll(() => {
  fb.removeAllTickets();
});
afterAll(() => {
  fb.removeAllTickets();
});

describe('General slash command responses', () => {
  test('User HELLO command', () => {
    expect(res.HELLO(prm)).toMatchObject({
      text: msg.hello.text,
      attachments: [{ text: msg.help.att(false) }],
    });
  });

  test('User HELP command', () => {
    expect(res.HELP(prm)).toMatchObject({
      text: msg.help.text,
      attachments: [{ text: msg.help.att(false) }],
    });
  });

  test('User ERROR command', () => {
    expect(res.ERROR(prm)).toMatchObject({
      text: msg.error.text,
      attachments: [{ text: msg.help.att(false) }],
    });
  });

  test('Admin HELLO command', () => {
    prm.isAdmin = true;
    expect(res.HELLO(prm)).toMatchObject({
      text: msg.hello.text,
      attachments: [{ text: msg.help.att(true) }],
    });
  });

  test('Admin HELP command', () => {
    expect(res.HELP(prm)).toMatchObject({
      text: msg.help.text,
      attachments: [{ text: msg.help.att(true) }],
    });
  });

  test('CANCEL command', () => {
    expect(res.CANCEL()).toMatchObject({
      attachments: [{ text: 'Cancelled' }],
    });
    expect(res.CANCEL().attachments[0].actions).toMatchObject([
      { name: 'HELP' },
      {
        name: 'SHOW',
        text: 'View all',
      },
    ]);
  });
});

describe('SHOW command', () => {
  const seedTickets = [
    {
      id1: {
        author: 'user1',
        text: 'text1',
        status: 'solved',
        number: 11,
      },
    },
    {
      id2: {
        author: 'user1',
        text: 'text2',
        status: 'open',
        number: 22,
      },
    },
  ];
  test('SHOW command with no tickets', () => {
    help.getTicketLists = jest.fn(() => []);
    return res.SHOW(prm).then((res) => {
      expect(help.getTicketLists).toBeCalled();
      expect(res).toMatchObject({
        attachments: [{ text: msg.show.list.empty }],
      });
    });
  });

  test('User SHOW command with found tickets', () => {
    prm.isAdmin = false;
    help.getTicketLists = jest.fn(() => seedTickets);
    return res.SHOW(prm).then((res) => {
      expect(help.getTicketLists).toBeCalled();
      expect(res).toMatchObject({
        attachments: [
          {
            title: msg.show.title.userTitle,
            fields: [{ title: msg.show.title.userSolved }, { title: msg.show.title.userOpen }],
          },
        ],
      });
    });
  });

  test('Admin SHOW command with found tickets', () => {
    prm.isAdmin = true;
    help.getTicketLists = jest.fn(() => seedTickets);
    return res.SHOW(prm).then((res) => {
      expect(help.getTicketLists).toBeCalled();
      expect(res).toMatchObject({
        attachments: [
          {
            fields: [{ title: msg.show.title.adminSolved }, { title: msg.show.title.adminOpen }],
          },
        ],
      });
    });
  });
});

describe('Action confirmation responses', () => {
  prm = { ...prm, command: 'OPEN', ticket: { author: 'user1', text: 'text', number: 10 } };
  test('Confirm OPEN', () => {
    fb.addNewTicket = jest.fn(() => 10);
    return res.CONFIRM(prm).then((res) => {
      expect(fb.addNewTicket).toBeCalledWith({
        userId: prm.userId,
        teamId: prm.teamId,
        text: 'Text',
      });
      expect(res).toMatchObject({ text: msg.confirm.submit(10, 'Text') });
    });
  });

  test('Confirm SOLVE command with ticket.author === user', () => {
    prm.command = 'SOLVE';
    fb.updateTicket = jest.fn();
    slackApi.sendDM = jest.fn();
    fb.addNewTicket = jest.fn();
    return res.CONFIRM(prm).then((res) => {
      expect(fb.addNewTicket).not.toBeCalled();
      expect(fb.updateTicket).toBeCalled();
      expect(slackApi.sendDM).not.toBeCalled();
      expect(res).toMatchObject({
        text: msg.confirm.newStatus(10, 'solved'),
      });
    });
  });

  test('Confirm SOLVE command with ticket.author !== user', () => {
    prm.ticket.author = 'notUser';
    fb.updateTicket = jest.fn();
    slackApi.sendDM = jest.fn();
    fb.addNewTicket = jest.fn();
    return res.CONFIRM(prm).then((res) => {
      expect(fb.addNewTicket).not.toBeCalled();
      expect(fb.updateTicket).toBeCalled();
      expect(slackApi.sendDM).toBeCalled();
      expect(res).toMatchObject({
        text: msg.confirm.newStatus(10, 'solved'),
      });
    });
  });
});

describe('Ticket open-solve-unsolve-close responses flow', () => {
  test('OPEN command', () => {
    prm = {
      ...prm,
      command: 'OPEN',
      ticket: { text: 'user1text1' },
      isAdmin: false,
    };
    expect(res.OPEN(prm)).toMatchObject({
      attachments: [
        {
          text: 'Open new ticket with text: user1text1?',
          actions: expect.any(Array),
        },
      ],
    });
    expect(res.OPEN(prm).attachments[0].actions).toMatchObject([
      { name: 'CANCEL' },
      { name: 'OPEN', value: JSON.stringify({ text: 'user1text1' }) },
      false,
    ]);
  });

  test('User SOLVE command disallowed', () => {
    prm = { ...prm, command: 'SOLVE' };
    expect(res.SOLVE(prm)).toMatchObject({
      text: ':no_entry_sign: Not allowed.',
      attachments: [{ text: msg.help.att(false) }],
    });
  });

  test('Admin SOLVE command with no ticket found', () => {
    prm = { ...prm, isAdmin: true, ticket: { number: 99 } };
    expect(res.SOLVE(prm)).toMatchObject({ text: msg.error.badTeam(prm.ticket.number) });
  });

  test("Admin SOLVE command with status !== 'open'", () => {
    prm.ticket = {
      text: 'user1text1',
      number: 10,
      team: 'team1',
      author: 'badAuthor',
      status: 'solved',
    };
    expect(res.SOLVE(prm)).toMatchObject({ text: msg.error.notAllowedStatus(prm.ticket) });
  });

  test('Admin SOLVE command with author !== user', () => {
    prm.ticket.status = 'open';
    expect(res.SOLVE(prm)).toMatchObject({
      attachments: [
        {
          text: msg.confirm.text(prm.command, prm.ticket),
          actions: expect.any(Array),
        },
      ],
    });
    expect(res.SOLVE(prm).attachments[0].actions).toMatchObject([
      { name: 'CANCEL' },
      { name: 'SOLVE', value: JSON.stringify(prm.ticket) },
      false,
    ]);
  });

  test('Admin SOLVE command with author === user', () => {
    prm.ticket.author = prm.userId;
    expect(res.SOLVE(prm)).toMatchObject({
      attachments: [
        {
          text: msg.confirm.adminSelfSolve(prm.ticket),
          actions: expect.any(Array),
        },
      ],
    });
    expect(res.SOLVE(prm).attachments[0].actions).toMatchObject([
      { name: 'CANCEL' },
      { name: 'SOLVE', value: JSON.stringify(prm.ticket) },
      { name: 'CLOSE' },
    ]);
  });

  test('UNSOLVE command with no ticket found', () => {
    prm = { ...prm, command: 'UNSOLVE', ticket: { number: 99 } };
    expect(res.UNSOLVE(prm)).toMatchObject({ text: msg.error.badTeam(prm.ticket.number) });
  });

  test('UNSOLVE command with status !== "solved"', () => {
    prm.ticket = {
      text: 'user1text1',
      number: 10,
      team: 'team1',
      author: 'badAuthor',
      status: 'open',
    };
    expect(res.UNSOLVE(prm)).toMatchObject({
      text: ':no_entry_sign: Not allowed. Ticket *#10* from <@badAuthor> is *open*.',
    });
  });

  test("UNSOLVE command with author !== 'user'", () => {
    prm.ticket.status = 'solved';
    expect(res.UNSOLVE(prm)).toMatchObject({
      text: ':no_entry_sign: Ticket *#10* is not yours.',
    });
  });

  test('UNSOLVE command with correct params', () => {
    prm.ticket.author = 'user1';
    expect(res.UNSOLVE(prm)).toMatchObject({
      attachments: [
        {
          text: 'Unsolve ticket *#10*: user1text1?',
          actions: expect.any(Array),
        },
      ],
    });
    expect(res.UNSOLVE(prm).attachments[0].actions).toMatchObject([
      { name: 'CANCEL' },
      { name: 'UNSOLVE', value: JSON.stringify(prm.ticket) },
      false,
    ]);
  });

  test('CLOSE command with no ticket found', () => {
    prm = { ...prm, command: 'CLOSE', ticket: { number: 99 } };
    expect(res.CLOSE(prm)).toMatchObject({
      text: msg.error.badTeam(prm.ticket.number),
    });
  });

  test('CLOSE command with status === "closed"', () => {
    prm.ticket = {
      text: 'user1text1',
      number: 10,
      team: 'team1',
      author: 'badAuthor',
      status: 'closed',
    };
    expect(res.CLOSE(prm)).toMatchObject({
      text: msg.error.closed(prm.ticket.number),
    });
  });

  test('CLOSE command with author !== user', () => {
    prm.ticket.status = 'solved';
    expect(res.CLOSE(prm)).toMatchObject({
      text: msg.error.notAuthor(prm.ticket.number),
    });
  });

  test('CLOSE command with correct params', () => {
    prm.ticket.author = prm.userId;
    expect(res.CLOSE(prm)).toMatchObject({
      attachments: [
        {
          text: 'Close ticket *#10*: user1text1?',
          actions: expect.any(Array),
        },
      ],
    });
    expect(res.CLOSE(prm).attachments[0].actions).toMatchObject([
      { name: 'CANCEL' },
      { name: 'CLOSE', value: JSON.stringify(prm.ticket) },
      false,
    ]);
  });
});
