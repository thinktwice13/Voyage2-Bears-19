require('dotenv').load({ path: '.env.test' });
const fb = require('../server/handlers/firebaseHandlers');
const { seed } = require('./helper');

const ticket5 = {
  userId: 'user1',
  teamId: 'team1',
  text: 'text5',
};

describe('Firebase ticket handlers', () => {
  beforeAll(fb.removeAllTickets);

  let ticketId = null;

  test('Add a new ticket', () =>
    fb.addNewTicket(ticket5).then((num) => {
      expect(num).toBe(1);
    }));

  // Check if simultaneous addNewTicket calls  result in different ticket numbers
  test('Simultaneously add tickets', () =>
    Promise.all(seed.map(fb.addNewTicket)).then((res) => {
      expect(res).toBeInstanceOf(Array);
      expect(res).toHaveLength(4);
      expect(res).toEqual([2, 3, 4, 1]); // Returned ticket numbers. The lat one belongs to team2
    }));

  test('Gets all open tickets by team', () =>
    fb.getAllOpenTicketsByTeam('team1').then((res) => {
      expect(res).toBeInstanceOf(Object);
      // Extract only tickets from normalized response
      const list = Object.values(res);
      expect(list).toHaveLength(4);
      list.forEach((ticket) => {
        expect(ticket).toHaveProperty('team', 'team1');
      });
      // Set ticket id to maipulate
      ticketId = Object.keys(res)[1];
    }));

  test('Gets ticket data by its number', () =>
    fb.getTicketByNumber(2, 'team1').then((ticket) => {
      expect(ticket).toMatchObject({
        [ticketId]: {
          team: 'team1',
          author: 'user1',
          number: 2,
        },
      });
    }));

  test('Gets all open tickets by user', () =>
    fb.getAllOpenTicketsByUser('user1', 'team1').then((list) => {
      const tickets = Object.values(list);
      expect(tickets).toHaveLength(3);
      tickets.forEach((ticket) => {
        expect(ticket).toMatchObject({
          author_status: 'user1_open',
          team: 'team1',
        });
      });
    }));

  test('Updates a ticket', () =>
    fb.updateTicket(ticketId, 'user1', 'team1', 'solved').then((ticket) => {
      expect(ticket).toBeInstanceOf(Object);
      expect(ticket).toMatchObject({
        status: 'solved',
        author_status: 'user1_solved',
      });
    }));

  test('Gets all solved tickets by user', () => {
    fb.getAllSolvedTicketsByUser('user1', 'team1').then((ticket) => {
      expect(ticket).toMatchObject({
        [ticketId]: {
          author_status: 'user1_solved',
          team: 'team1',
          status: 'solved',
        },
      });
      expect(Object.values(ticket)).toHaveLength(1);
    });
  });
});

describe('Firebase token handlers', () => {
  const botToken = 'botToken';
  const accessToken = 'accessToken';

  beforeAll(() => fb.setTokens(ticket5.teamId, accessToken, botToken));

  test('Gets tokens', () =>
    fb.getTokensByTeam(ticket5.teamId).then((res) => {
      expect(res).toEqual({ accessToken, botToken });
    }));
});
