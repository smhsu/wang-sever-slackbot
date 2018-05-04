# Wang Server Slackbot
A Slack chatbot that interfaces with Wang lab's servers, and especially monitors our file systems.

## Installation and running
Requirements: NodeJS >= 8.0.0, and file systems to monitor already mounted

1.  `npm install`
2.  Create a file called `.env`, and add one line that says `SLACK_TOKEN=[Wang House access token]` (without the
brackets).
    * If you have permission, you can find the token under "Bot Use OAuth Access Token" at
    https://api.slack.com/apps/AAHP05JKZ/install-on-team .
    * *NEVER EXPOSE THE TOKEN TO THE PUBLIC!*  Anybody that has the token will be able to send and receive messages
    under the bot's name without restriction.
3.  `npm start`

**Note**: avoid running more than one copy of the bot at the same time, as each instance will send messages, causing all
messages to appear more than once!

## Configuration
To customize...
* **the alert channel:** see consts in `main.js`
* **file systems to monitor, and warn threshold:** see consts in `diskUsage.js`
* **disk check frequency:** see consts in `diskUsage.js`
