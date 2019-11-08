'use strict';

/**
 * @fileOverview index.js
 * @description the bot used private group
 * @author kaito
 * @author waricoma
 * @version 1.0.1
 */

require('dotenv').config();
const packageJson = require('../package.json');
const http = require('http');
const { RTMClient, WebClient } = require('@slack/client');
const rtmClient = new RTMClient(process.env.TOKEN);
const webClientForUI = new WebClient(process.env.TOKEN);
const webClient = new WebClient(process.env.USER_TOKEN);

const triggerRegExp = new RegExp(`^${process.env.ICON}.+`);

rtmClient.on('message', (event) => {
  if (!('text' in event)) {
    return;
  }

  /**
   * @type {String}
   */
  const msg = event.text;

  if (msg.match(triggerRegExp)) {
    /**
     * @type {String}
     */
    const orderName = msg.split(/:/g)[2].trim();

    if (gpNameValidate(orderName)) {
      groupCreate(event, orderName);
    } else {
      replyToThread(event.channel, event.ts, 'Cannot use other special symbol than - and _ ');
    }
  }
});
rtmClient.start();

/**
 * Validating group name
 * @param {String} name group name
 * @returns {boolean}
 */
const gpNameValidate = (name) => {
  return !name.match(/[^a-z0-9_-]/gi);
};

/**
 * Create private channel
 * @param {Object} event
 * @param {String} gpName
 */
const groupCreate = async (event, gpName) => {
  let createdGp;

  try {
    createdGp = await webClient.groups.create({ name: gpName });
  } catch (err) {
    replyToThread(event.channel, event.ts, 'group creating failed');
    console.error(err);
    return;
  }

  try {
    await webClient.groups.invite({
      user: event.user,
      channel: createdGp.group.id
    });
    await webClient.groups.invite({
      user: process.env.BOT_ID,
      channel: createdGp.group.id
    });
    await webClient.groups.leave({
      channel: createdGp.group.id
    });
  } catch (err) {
    replyToThread(event.channel, event.ts, 'user inviting failed');
    console.error(err);
    return;
  }

  replyToThread(event.channel, event.ts, 'success');
};

/**
 * Reply to Thread
 * @param {String} ch
 * @param {String} ts
 * @param {String} text
 */
const replyToThread = (ch, ts, text) => {
  webClientForUI.chat.postMessage({
    channel: ch,
    username: process.env.NAME,
    icon_emoji: process.env.ICON,
    thread_ts: ts,
    text
  }).catch(err => console.log(err));
};

http.createServer((req, res) => {
  res.writeHead(
    200,
    {
      'Content-Type': 'text/html'
    }
  );
  res.write(packageJson.name);
  res.end();
}).listen(process.env.PORT, process.env.HOST, () => {
  console.log(`Server running at http://${process.env.HOST}:${process.env.PORT}`);
});
