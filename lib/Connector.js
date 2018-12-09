const WebSocket = require('ws')
const EventEmitter = require('events')
const request = require('request')

class Connector extends EventEmitter {
    constructor(cfg){
        super()
        if(typeof cfg !== 'object') throw new Error('configuration is not a object')
        this.url = cfg.url
        this.db = cfg.db
        this.key = cfg.key
        this.data
        this.username = cfg.username
        this.password = cfg.password
    }

    init(callback){
        let self = this
        this.ws = new WebSocket('ws://' + this.url)

        this.ws.on('open', function open() {

            // login
            if(self.username && self.password){
                self.sendData(null, 'login', { email : self.username, password: self.password})
            }

            // subscribe the data
            self.sendData(self.db, 'subscribe', self.key + '#')

            // get the data
            self.getData(self.db, 'stream', 'gte=' + self.key + '&lte=' + self.key + '~', function(err, body){
                try{
                    self.data = JSON.parse(body)
                    callback(null)
                }
                catch(e){
                    callback(e)
                }     
            })

        });

        this.ws.on('error', function open(e) {
            self.emit('error', e)
        });

        this.ws.on('close', function open(e) {
            self.emit('close', e)
        });

        this.ws.on('message', function incoming(data) {
            try{
                self.emit('message', JSON.parse(data))
            }
            catch(e){
                self.emit('error', e)
            }
        });
    }

    sendData(db, meta, data){
        try{
            this.ws.send(JSON.stringify( { db : db, meta : meta, data : data } ))
        }
        catch(e){
            self.emit('error', e )
        }
    }

    getData(db, meta, params, callback){

        callback = callback || params
        let p = typeof params === 'string' ? '?' + params : ''
        request( 'http://' + this.url + '/' + db + '/' + meta + p, function (error, response, body) {
            callback(error, body)
        });  
    }

    /**
     * 
     * @param {string} db 
     * @param {string} meta 
     * @param {object} data { key : '', value : ''}
     * @param {function} callback 
     */
    postData(db, meta, data, callback){

        callback = callback || function(){}
        request.post({ 
            url: 'http://' + this.url + '/' + db + '/' + meta, 
            json: data
        }, 
        function(error, httpResponse, body){ 
            callback(error, body)
        }) 
    }
}

module.exports = Connector