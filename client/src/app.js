import { PLATFORM } from 'aurelia-pal';
import {inject} from "aurelia-framework";
import {HttpClient, json} from "aurelia-fetch-client";

import {Socket} from './socket';
import __ from 'iterate-js';

@inject(HttpClient, Socket)
export class App {
    constructor(http, socket) {
        var self = this;
        self.http = http;
        self.socket = socket;

        self.loading = 0;
        self.strategies = [];
        self.settings = null;

        self.socketHandlers = {
            'scrape-target-status': data => {
                var item = __.search(self.settings.targets, target => target.url == data.target.url && target.subfolder == data.target.subfolder);
                if(item) {
                    item.status = data.status;
                    if(data.err)
                        item.error = data.err;
                }
            },
            'scrape-complete': data => {
                self.loading--;
                if(!data.success)
                    console.log(data.err);
            }
        };

        self.loading++;
        self.http.fetch('strategies')
            .then(res => res.json())
            .then(data => {
                self.loading--;
                self.strategies = data;
                self.reset();
            });
    }

    attached() {
        this.socket.bind(this.socketHandlers);
    }

    detached() {
        this.socket.unbind(this.socketHandlers);
    }

    selectStrategy(strat) {
        this.settings.strategy = strat;
    }

    add() {
        this.settings.targets.unshift({ url: '', subfolder: '' });
    }

    remove(target) {
        var idx = this.settings.targets.indexOf(target);
        if(idx > -1)
            this.settings.targets.splice(idx, 1);
    }

    reset() {
        this.settings = {
            strategy: this.strategies[0],
            folder: '',
            targets: []
        };
    }

    resetTargets() {
        this.settings.targets = [];
    }

    submit() {
        var self = this;
        self.loading++;
        self.socket.con.emit('scrape', self.settings);
    }

    retry() {
        this.settings.targets = __.map(__.filter(this.settings.targets, x => x.status == 'danger'), x => ({ url: x.url, subfolder: x.subfolder }));
        this.submit();
    }
}
