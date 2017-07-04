
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var request = require('request');
var cheerio = require('cheerio');
var __ = require('iterate-js');

module.exports = class {
    constructor() {
        this.targets = [];
    }

    getFileName(target, idx) {
        return idx.toString();
    }

    getFileExtension(target) {
        return path.extname(target);
    }

    run(client, settings) {
        var self = this;
        return new Promise((res, rej) => {
            var idx = -1,
                target = null;

            self.settings = settings;

            var next = () => {
                idx++;
                target = settings.targets[idx];

                if(target) {
                    try {
                        self.load(target.url)
                            .then($ => {
                                client.emit('scrape-target-status', { status: 'warning', target: target });
                                self.scan(target.url, $)
                                    .then(() => {
                                        client.emit('scrape-target-status', { status: 'info', target: target, targets: self.targets });
                                        self.save(path.join(settings.folder, target.subfolder))
                                            .then(() => {
                                                client.emit('scrape-target-status', { status: 'success', target: target });
                                                next();
                                            });
                                    });
                            });
                    } catch(err) {
                        console.log(err);
                        client.emit('scrape-target-status', { status: 'danger', target: target, err: err });
                    }
                } else
                    res();
            };

            next();
        });
    }

    save(folder) {
        // override me
        return new Promise((res) => { res(); });
    }

    load(url) {
        var self = this;
        return new Promise((response, reject) => {
            request({ uri: url, gzip: true }, function(error, res, html) {
                if(error) {
                    console.log(error);
                    reject(error);
                } else {
                    var $ = cheerio.load(html);
                    response($);
                }
            });
        });
    }

    download(url, path) {
        console.log(`Downloading: ${url}`);
        return new Promise((response, reject) => {
            if(fs.existsSync(path))
                fs.unlinkSync(path);
            request.head(url, function(err, res, body) {
                request(url).pipe(fs.createWriteStream(path)).on('close', () => { response(); });
            });
        });
    }

    generate(path) {
        shell.mkdir('-p', path);
    }

    scan($html) {
        // override me
        return new Promise((res) => { res(); });
    }
}
