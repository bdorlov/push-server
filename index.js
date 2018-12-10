const http = require('http');
const fs = require('fs');
const url = require('url');
const gcm = require('node-gcm');

let db = [];
if (fs.existsSync('db')) {
  try {
    db = JSON.parse(fs.readFileSync('db'));
  } catch(e) {
    console.log('Error in loading:', e);
  }
}

function addPushNotificationData(data) {
  for (item of db) {
    if (item.token === data.token) {
      return;
    }
  }
  db.push(data);
  fs.writeFile('db', JSON.stringify(db), (err) => {
    if (err) {
      console.log('Error in addPushNotificationData', err);
    }
  });
}


const appToken = fs.readFileSync('token').toString().trim();
const sender = new gcm.Sender(appToken);

function sendPushNotification(token, text, header = "Flowers and gifts") {
  const message = new gcm.Message({
    notification: {
      title: header,
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

/*let database
try {
  database = fs.readFileSync('database.json');
  database = JSON.parse(database);
} catch (e) {
  if (e.errno === -2) {
    database = [];
  } else {
    console.log('error = ', Object.keys(e));
  }
}*/



function createDeviceItemHTML(data) {
  return `<div class="device" data-token="${data.token}">
    <div class="device__token">Token: ${data.token}</div>
    <div class="device__os">OS: ${data.os} - ${data.version}</div>
  </div>`.replace(/[\t\n]/g, '');
}

function createDeviceListHTML(list) {
  let html = '';
  for (let device of list) {
    html += createDeviceItemHTML(device);
  }
  console.log('HTML = ', html)
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
    const template = fs.readFileSync('index.html').toString();
    const context = {
      list: createDeviceListHTML(db)
    };
    const html = render(template, context);
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    res.end(html);
  /*} else if (path === '/new-token') {
    const token = URL.query.token;
    console.log('token = ', token);
    message = 'hello from node.js!';
    sendPushNotification(token, message);
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    res.end('ok');*/
  } else if (path === '/push-notification-data') {
    const token = URL.query.token;
    const os = URL.query.os;
    const version = URL.query.version;
    console.log(token, os, version);
    addPushNotificationData({token, os, version});
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    res.end('ok');
  } else if (path === '/send') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', function(data) {
        body += data;
      });
      req.on('end', function() {
        const data = JSON.parse(body.toString());
        const token = data.token;
        const header = data.header;
        const text = data.body;
        console.log('token = ', token);
        console.log('header = ', header);
        console.log('body = ', text);
        sendPushNotification(token, text, header);
      });
    } else {
      res.writeHead(405, {
        'Content-Type': 'text/plain'
      });
      return res.end('Method not allowed!');
    }
    res.end('ok');
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
