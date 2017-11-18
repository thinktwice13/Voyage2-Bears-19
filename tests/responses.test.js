require('dotenv').load({ path: '.env.test' });
const fb = require('../server/handlers/firebaseHandlers');
const res = require('../server/utils/responses');
const { msg } = require('../server/utils/helpers');

// Params
let prm = {
  userId: 'user1',
  teamId: 'team1',
  text: 'text1',
};

describe('General slash command responses', () => {
  beforeAll(fb.removeAllTickets);

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

  test('User SHOW command with no tickets', () =>
    res.SHOW(prm).then((res) => {
      expect(res).toMatchObject({
        attachments: [{ text: msg.show.list.empty }],
      });
    }));

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
