const http = require('http');
const fs = require('fs');
const url = require('url');
const gcm = require('node-gcm');

const appToken = fs.readFileSync('token').toString().trim();
const sender = new gcm.Sender(appToken);

function sendPushNotification(token, text) {
  const message = new gcm.Message({
    notification: {
      title: "Flowers and gifts",
      icon: "ic_launcher",
      body: text
    }
  });

  const regTokens = [token];

  sender.send(message, { registrationTokens: regTokens }, function (err, response) {
  	if (err) {
      return console.error(err);
    }
    console.log(response);
  });
}

let database
try {
  database = fs.readFileSync('database.json');
  database = JSON.parse(database);
} catch (e) {
  if (e.errno === -2) {
    database = [];
  } else {
    console.log('error = ', Object.keys(e));
  }
}

const template = fs.readFileSync('index.html');

function createDeviceItemHTML(device) {
  return `<li>${device}</li>`
}

function createDeviceListHTML(list) {
  let html = '';
  for (let device of list) {
    html += createDeviceItemHTML(device);
  }
  return html;
}

function render(template, context = {}) {
  let html = template;
  if (context) {
    for (let key in context) {
      html = html.replace(`<!-- ${key} -->`, context[key]);
    }
  }
  return html;
}

const server = http.createServer((req, res) => {
  console.log('url = ', req.url);
  const URL = url.parse(req.url, true);
  const path = URL.pathname;
  console.log('URL = ', URL);
  if (path === '/') {
    const context = {
      list: createDeviceListHTML(database)
    };
    const html = render(template);
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    res.end(html);
  } else if (path === '/new-token') {
    const token = URL.query.token;
    console.log('token = ', token);
    message = 'hello from node.js!';
    sendPushNotification(token, message);
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    res.end('ok');
  } else if (path === 'send') {
    res.end('');
  } else {
    res.writeHead(404, {
      'Content-Type': 'text/html'
    });
    res.end('Not found');
  }

});

server.listen(8000, () => {
  console.log('server started!!!');
})
