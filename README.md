# [TickyBot](https://tickybott.herokuapp.com/)
Let your team manage their support tickets 100% inside Slack

## Description
Users can submit tickets regarding problems and issues they are experiencing.
<br>
Team owners and admins can see and deal with the tickets that the users submit.
<br>
Users get notified once their ticket has been handled. They can then either mark the ticket as complete or reopen it for further investigation.
### Built With
Main components of the project are **Slack API**, **Firebase**, **ReactJS** and **Node** with **Express**.

## Install
Get the app at https://tickybott.herokuapp.com/

## Usage
- Use `/ticket help` to see usage instructions
- Use `/ticket show` to see open and/or solved tickets
#### Users
- Use `/ticket [message]` or `/ticket open [message]` to open a new ticket
- Use `/ticket unsolve #[ticket number]` to reopen a solved ticket if the issue hasn't been fixed
- Use `/ticket close #[ticket number]` to close a solved ticket

#### Team owners and admins:
- Use `/ticket solve #[ticket number]` to mark tickets as solved and notify their authors

## Authors
* [osycon](https://github.com/osycon) (Team Leader)
* [thinktwice13](https://github.com/thinktwice13)
* [miljan-fsd](https://github.com/miljan-fsd)
* [Zsolti](https://github.com/zsoltime)

## License
[MIT](https://tldrlegal.com/license/mit-license)
