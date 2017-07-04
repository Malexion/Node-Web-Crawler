
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app); 
var io = require('socket.io')(server);

var fs = require('fs');
var path = require('path');

var baseDir = path.resolve(__dirname, '..'),
    serverDir = path.join(baseDir, 'server'),
    clientDir = path.join(baseDir, 'client'),
    clientDistDir = path.join(clientDir, 'dist');

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});
app.use(express.static(clientDistDir));

app.get('/', (req, res, next) => {
    res.sendFile(`${clientDistDir}/index.html`);
});

app.get('/strategies', function(req, res) {
    var files = fs.readdirSync(`${serverDir}/strategies/`);
    res.json(files.map(x => path.parse(x).name));
});

io.on('connection', function(client) {
    console.log('Client Connected...');

    client.on('join', function(data) {
        console.log('Tunnel Established.');
    });
    client.on('scrape', function(settings) {
        try {
            var Strategy = require(`./strategies/${settings.strategy}.js`);
            var instance = new Strategy();
            instance.run(client, settings)
                .then(() => {
                    console.log('Done');
                    client.emit('scrape-complete', { success: true, err: null });
                });
        } catch(err) {
            console.log(err);
            client.emit('scrape-complete', { success: false, err: err });
        }
    });
});

console.log('Online.');
server.listen(process.env.PORT || 8081);
