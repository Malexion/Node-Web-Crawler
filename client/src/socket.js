
import io from 'socket.io-client';
import __ from 'iterate-js';

export class Socket {
    constructor() {
        var self = this;

        var connection = io.connect(window.location.origin);

        connection.on('connect', function(data) {
            connection.emit('join', true);
        });

        self.con = connection;
    }

    bind(handlers) {
        var self = this;
        __.all(handlers, (handler, event) => self.con.on(event, handler));
    }

    unbind(handlers) {
        var self = this;
        __.all(handlers, (handler, event) => self.con.off(event, handler));
    }
}
