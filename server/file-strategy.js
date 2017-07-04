
var __ = require('iterate-js');
var Strategy = require('./strategy');

module.exports = class extends Strategy {
    constructor() {
        super();
    }

    save(folder) {
        var self = this;
        return new Promise((res, rej) => {
            var idx = 0,
                target = null;
            
            self.generate(folder);
            
            var next = () => {
                if(self.targets.length > 0) {
                    target = self.targets.shift();
                    if(target) {
                        self.download(target, `${folder}/${self.getFileName(target, idx)}${self.getFileExtension(target)}`)
                            .then(() => {
                                idx++;
                                next();
                            });
                    }
                } else
                    res();
            };

            next();
        });
    }
}
