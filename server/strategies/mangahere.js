
var path = require('path');

var __ = require('iterate-js');
var FileStrategy = require('../file-strategy');

module.exports = class extends FileStrategy {
    constructor() {
        super();
    }

    getFileExtension(target) {
        return path.extname(target.split('?')[0]);
    }

    scan(current, $) {
        var self = this;
        return new Promise((res, rej) => {
            var $chapterList = $('.detail_list');
            if($chapterList[0]) {
                var chapters = [];
                $chapterList.find('ul li a').each(function(idx, el) { chapters.push($(this).attr('href')); });
                chapters.reverse();

                var chapter = null;
                var scanChapter = () => {
                    chapter = chapters.shift();
                    if(chapter) {
                        console.log(`Found Chapter: ${chapter}`);
                        self.scanPages(chapter)
                            .then(() => { scanChapter(); });
                    } else
                        res();
                };
                scanChapter();
            } else
                rej();
        });
    }

    scanPages(baseurl) {
        var self = this;
        return new Promise((res, rej) => {
            self.load(baseurl)
                .then($ => {
                    var $image = $('#image'),
                        url = $image.attr('src'),
                        next = $image.parent().attr('href');

                    if(url) {
                        self.targets.push(url);
                        console.log(`Found Image: ${url}`);

                        if(next == 'javascript:void(0);') {
                            res();
                        } else {
                            self.scanPages(next).then(() => { res(); });
                        }
                    } else {
                        // Retry
                        console.log(`Retrying: ${baseurl}`);
                        self.scanPages(baseurl).then(() => { res(); });
                    }
                });
        });
    }
}
