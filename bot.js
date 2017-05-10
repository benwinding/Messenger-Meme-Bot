//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<footer id=\"gWidget\"></footer><script src=\"https://widget.glitch.me/widget.min.js\"></script></body></html>";
const DEBUG = false;

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
  }
  res.sendStatus(200);
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  logMessage(`Received message from user ${senderID}, with message: ${message.text}`);

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    var messageTerms = messageText.split(' ');

    if(messageTerms.length == 1) {
      var firstTerm = messageTerms[0];
      if(textMatches(firstTerm, "meme"))
        sendMeme(senderID);
      else if(textMatches(firstTerm, "👍"))
        sendMeme(senderID);
      else if(textMatches(firstTerm, "normal"))
        sendMeme(senderID);
      else if(textMatches(messageText, "dank"))
        sendMemeDank(senderID);
      else if(textMatches(firstTerm, "help"))
        sendHelp(senderID);
      else if(textMatches(firstTerm, "why"))
        sendWhy(senderID);
      else if(textMatches(firstTerm, "how"))
        sendHow(senderID);
      else if(textMatches(firstTerm, "random"))
        sendRandom(senderID);
      else
        sendWelcome(senderID);
    }
    else {
      removeString(messageTerms, "meme");
      if(textMatches(messageText, "dank"))
        sendMemeDank(senderID);
      else if(textMatches(messageText, "find"))
      {
        removeString(messageTerms, "find");
        var searchTerm = getLongestString(messageTerms);
        sendSearched(senderID, searchTerm);
      }
      else if(textMatches(messageText, "search"))
      {
        removeString(messageTerms, "search");
        var searchTerm = getLongestString(messageTerms);
        sendSearched(senderID, searchTerm);
      }
      else
        sendWelcome(senderID);
    }
  }
  else
    sendMemeMonth(senderID);
}

//////////////////////////
// Send Descriptions
//////////////////////////

function sendWhy(recipientId) {
  var sendMsg = `why the hell not mate?!`;
  sendTextWithCommands(recipientId, sendMsg);
}

function sendHow(recipientId) {
  var sendMsg = `
Here's how I work!
https://github.com/benwinding/Messenger-Meme-Bot

(Ben Winding 2017)
`;
  sendTextWithCommands(recipientId, sendMsg);
}

function sendHelp(recipientId) {
  var apiDesc = `( ͡° ͜ʖ ͡°) Below are my commands:
👍 or meme => random meme ;)
dank => dank meme
find blah => finds a meme related to blah
...
help => this...
why => ??
how => source code link
random => sends really random image

Careful, you could get anything with memebot...

(Ben Winding 2017)
  `;
  sendTextWithCommands(recipientId, apiDesc);
}

function sendWelcome(recipientId) {
  request({
      url: 'https://graph.facebook.com/v2.6/' + recipientId 
        + '?access_token=' + process.env.PAGE_ACCESS_TOKEN
    },
    function (error, response, body) {
      if (error || response.statusCode != 200) return;
    
      var fbProfileBody = JSON.parse(body);
      var userName = fbProfileBody["first_name"];
      var greetings = ["Hey", "Howdy", "Hello", "G'day", "Bonjur", "Good Evening", "Good Morning", "Yo", "What's up"];
      var randomGreeting = getRandomItemFromArray(greetings);
      var welcomeMsg = `${randomGreeting} ${userName}, 
I'm your personal Memebot™!
Try my buttons below!
¯\\_(ツ)_/¯
      `;
      sendTextWithCommands(recipientId, welcomeMsg);
    }
  );
}

//////////////////////////
// Meme senders
//////////////////////////

function sendMemeDank(recipientId) {
  var choice = getRandomNumber(1, 11);
  switch (choice) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      sendMemeFunctionSubReddit(recipientId, 'dankmemes', 'week', 2, 30); break;
    case 6:
    case 7:
    case 8:
      sendMemeFunctionSubReddit(recipientId, 'dankmemes', 'month', 5, 40); break;
    case 9:
    case 10:
      sendMemeFunctionSubReddit(recipientId, 'dankmemes', 'year', 10, 30); break;
    default:
      sendMemeFunctionSubReddit(recipientId, 'dankmemes', 'all', 10, 30); break;    
  }
}

function sendMeme(recipientId) {
  var choice = getRandomNumber(1, 11);
  switch(choice) {
    case 1: 
    case 2: 
    case 3: 
    case 4: 
    case 5: 
      sendMemeWeek(recipientId); break;
    case 6: 
    case 7: 
    case 8: 
      sendMemeMonth(recipientId); break;
    case 9: 
    case 10: 
      sendMemeYear(recipientId); break;
    default: 
      sendMemeAll(recipientId); break;
  }
}

function sendSearched(recipientId, searchTerm) {
  sendMemeSearched(recipientId, searchTerm);
}

function sendMemeWeek(recipientId) {
  sendMemeFunction(recipientId, 'week', 1, 50);
}

function sendMemeMonth(recipientId) {
  sendMemeFunction(recipientId, 'month', 3, 60);
}

function sendMemeYear(recipientId) {
  sendMemeFunction(recipientId, 'year', 4, 60);
}

function sendMemeAll(recipientId) {
  sendMemeFunction(recipientId, 'all', 3, 60);
}

function sendMemeFunction(recipientId, timePeriod, pageLast, itemsLast)
{
  request({
      url: 'https://api.imgur.com/3/gallery/t/dump/top/' + timePeriod + '/' + randomIntFromInterval(0,pageLast),
      headers: {
        'Authorization': 'Client-ID ' + process.env.IMG_CLIENT_ID
      }
    },
    function (error, response, body) {
      if (error || response.statusCode != 200) return;

      logMessage(`--Finding memes in 'dump' time: ${timePeriod}, pages:${pageLast}, numItems:${itemsLast}`);
      var galleryResponse = JSON.parse(body);
      logMessage(`--Found: ${galleryResponse.data.items.length}, albumns or single images`);
      var firstBest = galleryResponse.data.items.slice(0,itemsLast);
      var randomGalleryItem = getRandomItemFromArray(firstBest);
      if(randomGalleryItem.is_album) {
        sendRandomAlbumnImage(recipientId, randomGalleryItem.id);
      }
      else {
        sendImage(recipientId, randomGalleryItem.link);
      }
    }
  );
}

function sendMemeFunctionSubReddit(recipientId, subReddit, timePeriod, pageLast, itemsLast)
{
  request({
      url: 'https://api.imgur.com/3/gallery/r/' + subReddit + '/top/' + timePeriod + '/' + randomIntFromInterval(0,pageLast),
      headers: {
        'Authorization': 'Client-ID ' + process.env.IMG_CLIENT_ID
      }
    },
    function (error, response, body) {
      if (error || response.statusCode != 200) return;

      logMessage(`--Finding memes in 'subreddit' subReddit:${subReddit}, time: ${timePeriod}, pages:${pageLast}, numItems:${itemsLast}`);
      var galleryResponse = JSON.parse(body);
      logMessage(`--Found: ${galleryResponse.data.length}, albumns or single images`);
      var firstBest = galleryResponse.data.slice(0,itemsLast);
      var randomGalleryItem = getRandomItemFromArray(firstBest);
      if(randomGalleryItem.is_album) {
         sendRandomAlbumnImage(recipientId, randomGalleryItem.id);
      }
      else {
         sendImage(recipientId, randomGalleryItem.link);
      }
    }
  );
}

function sendMemeSearched(recipientId, searchMeme, itemsLast)
{
  request({
      url: 'https://api.imgur.com/3/gallery/search/top/0?q=meme%20' + searchMeme,
      headers: {
        'Authorization': 'Client-ID ' + process.env.IMG_CLIENT_ID
      }
    },
    function (error, response, body) {
      logMessage(`--Searching for meme with keyword: ${searchMeme}`);
      if (error || response.statusCode != 200) return;
      var galleryResponse = JSON.parse(body);
      if(galleryResponse.data.length == 0) {
        sendTextWithCommands(recipientId, "No memes found :( try another");
        return;
      }
      logMessage(`--Found: ${galleryResponse.data.length}, albumns or single images`);
      var firstBest = galleryResponse.data.slice(0,itemsLast);
      var randomGalleryItem = getRandomItemFromArray(firstBest);
      if(randomGalleryItem === undefined) {
        sendTextWithCommands(recipientId, "No memes found :( try a different search word");
        return;
      }
      if(randomGalleryItem.is_album) {
         sendRandomAlbumnImage(recipientId, randomGalleryItem.id);
      }
      else {
         sendImage(recipientId, randomGalleryItem.link);
      }
    }
  );
}

function sendMemeTEST(recipientId, message) {
  sendMemeSearched(recipientId, 'dog', 10);
}

function sendRandom(recipientId) {
  request({
      url: 'https://api.imgur.com/3/gallery/random/random/1/',
      headers: {
        'Authorization': 'Client-ID ' + process.env.IMG_CLIENT_ID
      }
    },
    function (error, response, body) {
      if (error || response.statusCode != 200) return;

      var imgurApiResponse = JSON.parse(body);
      logObjectDebug(imgurApiResponse);
      var randomGalleryItem = getRandomItemFromArray(imgurApiResponse.data);
      if(randomGalleryItem.is_album) {
         sendRandomAlbumnImage(recipientId, randomGalleryItem.id);
      }
      else {
         sendImage(recipientId, randomGalleryItem.link);
      }
    }
  );
}

function sendRandomAlbumnImage(recipientId, id) {
  request({
      url: "http://api.imgur.com/3/gallery/album/" + id,
      headers: {
        'Authorization': 'Client-ID ' + process.env.IMG_CLIENT_ID
      }
    },
    function (error, response, body) {
      if (error || response.statusCode != 200) return;

      var imgurApiResponse = JSON.parse(body);
      logMessage(`--Albumn selected with: ${imgurApiResponse.data.images.length} images, url: ${"https://imgur.com/gallery/" + id}`);
      var randomAblumnImage = getRandomItemFromArray(imgurApiResponse.data.images);
      logObjectDebug(randomAblumnImage);
      sendImage(recipientId, randomAblumnImage.link);
    }
  );
}

function sendImage(recipientId, imageUrl) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    "message":{
      attachment: { 
        type: "image",
        payload: {
          url: imageUrl
        }
      },
      "quick_replies": GetQuickReplies()
    }
  }
  logMessage(`--Sending image with url: ${imageUrl}`);
  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  logMessage(`--Sending message with text and quick_replies: ${messageText}`);
  callSendAPI(messageData);
}

function sendTextWithCommands(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      text: messageText,
      "quick_replies": GetQuickReplies()
    }
  }
  logMessage(`--Sending message with text and quick_replies: ${messageText}`);
  callSendAPI(messageData);
}

function GetQuickReplies() {
  return [
    {
      "content_type":"text",
      "title":"Normal",
      "payload":"   ",
      "image_url":"http://i.imgur.com/vTstaG7.png"
    },
    {
      "content_type":"text",
      "title":"Dank",
      "payload":"   ",
      "image_url":"http://i.imgur.com/nE9A8zX.png"
    },
    {
      "content_type":"text",
      "title":"Random",
      "payload":"   ",
      "image_url":"http://i.imgur.com/mV7Diob.png"
    },    
    {
      "content_type":"text",
      "title":"Help",
      "payload":"   ",
      "image_url":"http://i.imgur.com/HrdBnhZ.png"
    }    
  ]
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      logMessage(`Successfully sent generic message with id ${messageId} to recipient ${recipientId}`); 
    } else {
      logMessage("Unable to send message"); 
      logMessage(response);
      logMessage(error);
    }
  });  
}

//////////////////////////
// Generic helpers
//////////////////////////

function getRandomNumber(minimum, maxmimum) {
  return Math.floor(Math.exp(Math.random()*Math.log(maxmimum-minimum+2)))+minimum-1;
}

function randomIntFromInterval(min,max) {
  return getRandomNumber(min, max);
}

function textMatches(message, matchString) {
  return message.toLowerCase().indexOf(matchString) != -1;
}

function getRandomItemFromArray(items) {
  var random_item = items[getRandomNumber(0, items.length - 1)];
  return random_item;
}

function removeString(strArray) {
  var index = strArray.indexOf(strArray);
  if(index != -1)
      strArray.splice(index, 1);
}

function getLongestString(strArray) {
  return strArray.sort(function (a, b) { return b.length - a.length; })[0];
}

function logObjectDebug(obj) {
  if(DEBUG)
    console.log(JSON.stringify(obj, null, 2));
}

function logMessage(logMessage) {
  console.log(logMessage);
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});
