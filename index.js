'use strict';

require('dotenv').config();

/**
 * @author kaito
 * @description the bot used private group
 */

const http = require('http');
const { RTMClient, WebClient } = require('@slack/client');
const rtm = new RTMClient(process.env.USERTOKEN);
const webClient = new WebClient(process.env.TOKEN);
const webClient2 = new WebClient(process.env.USERTOKEN);


rtm.on('message', (event) => {
  if (!('text' in event)) {
    return;
  }
  const msg = event.text;
  if (msg.match(/^!create_group/g)) {
    const args = msg.split(/\s/g);
    if (validate(args[1])) {
      create(event, args[1]);
    } else {
      sendMessage(event.channel, event.ts, 'Cannot use other special symbol than - and _ ');
    }
  }
});

/**
 * Validating channel name
 * @param {String} msg 
 */

const validate = (msg) => {
  return !msg.match(/[^a-z0-9_-]/gi);
};


/**
 * Create private channel
 * @param {Object} event 
 * @param {String} msg 
 */
const create = (event, msg) => {
  webClient.groups.create({
    name: msg
  })
    .then(res => {
      webClient.groups.invite({
        user: event.user,
        channel: res.id
      })
        .catch(err => console.log(err));
    })
    .catch(err => {
      sendMessage(event.channel, event.ts, err.data.error);
    });
};

/**
 * Reply to Thread
 * @param {String} ch 
 * @param {String} ts 
 * @param {String} text 
 */

const sendMessage = (ch, ts, text) => {
  webClient2.chat.postMessage({
    channel: ch,
    username: `${process.env.NAME}`,
    icon_emoji: `:${process.env.ICON}:`,
    thread_ts: ts,
    text
  }).catch(err => console.log(err));
};

rtm.start();

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('slack group creator');
  res.end();
}).listen(process.env.PORT, '0.0.0.0', () => console.log(`Listening to port ${process.env.PORT}`));
