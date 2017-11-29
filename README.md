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

![Help commands](https://i.imgur.com/K55BQrw.gif)
- Use `/ticket show` to see open and/or solved tickets

![/ticket show](https://imgur.com/XKU3wkW.gif)
- Use `/ticket [message]` or `/ticket open [message]` to open a new ticket

![/ticket or /ticket open](https://imgur.com/HHN7zBb.gif)
- Use `/ticket unsolve #[ticket number]` to reopen a solved ticket if the issue hasn't been fixed

![/ticket unsolve](https://imgur.com/ypZadm7.gif)
- Use `/ticket close #[ticket number]` to close a solved ticket

![/ticket close #[1]](https://imgur.com/XNFNsN9.gif)
#### Restricted to team owners and admins:
- Use `/ticket solve #[ticket number]` to mark tickets as solved and notify their authors

![/ticket solve #[1]](https://imgur.com/saUjq3L.gif)


## Authors
* [osycon](https://github.com/osycon) (Team Leader)
* [thinktwice13](https://github.com/thinktwice13)
* [Zsolti](https://github.com/zsoltime)

## License
[MIT](https://tldrlegal.com/license/mit-license)
