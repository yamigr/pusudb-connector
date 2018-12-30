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
        this.loginActive = this.username && this.password
        this.reconnectInterval = 10000
    }

    send_(db, meta, data){
        try{
            this.ws.send(JSON.stringify( { db : db, meta : meta, data : data } ))
        }
        catch(e){
            this.emit('error', e )
        }
    }

    get_(db, meta, params, callback){

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
    post_(db, meta, data, callback){

        callback = callback || function(){}
        request.post({ 
            url: 'http://' + this.url + '/' + db + '/' + meta, 
            json: data
        }, 
        function(error, httpResponse, body){ 
            callback(error, body)
        }) 
    }

    open(){
        let self = this
        let error = null
        this.ws = new WebSocket('ws://' + this.url)

        this.ws.on('open', function open() {
            // login
            if(self.loginActive){
                self.send_(null, 'login', { value : {email : self.username, password: self.password}})
                // pretty ugly, but the message event should be clean without logic to force the performance
                setTimeout(function(){
                    self.emit('open')
                }, 2000)
            }
            else{
                self.emit('open')
            }
  
        });

        this.ws.on('error', function open(e) {
            self.emit('error', e)
            setTimeout(self.connect.bind(self), self.reconnectInterval);
        });

        this.ws.on('close', function open(e) {
            self.emit('close', e)
        });

        this.ws.on('message', function incoming(data) {
            try{
                data =  JSON.parse(data)
                self.emit(data.meta, data)
            }
            catch(e){
                self.emit('error', e)
            }
        });    
    }

    subscribeAll(){
        this.send_(this.db, 'subscribe', this.key + '#' )
    }

    unsubscribeAll(){
        this.send_(this.db, 'unsubscribe', this.key + '#') 
    }

    streamAll(callback){
        // get the data
        this.get_(this.db, 'stream', 'gte=' + this.key + '&lte=' + this.key + '~', function(err, body){
            try{
                callback(null, JSON.parse(body))
            }
            catch(e){
                callback(e, null)
            }     
        })
    }

    push(meta, data){
        this.send_(this.db, meta, data)
    }

    pull(meta, data, callback){
        this.post_(this.db, meta, data, function(err, data){
            callback(err, data)
        })
    }

}

module.exports = Connector