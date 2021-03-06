const WebSocket = require('ws')
const EventEmitter = require('events')
const request = require('request')

class Connector extends EventEmitter {
    constructor(cfg){
        super()
        if(typeof cfg !== 'object') throw new Error('configuration is not a object')
        this.cfg = cfg
        this.data
        this.ws
        this.reconnectInterval = 1000
        this.pingTimeout
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
        request( 'http://' + this.cfg.url + '/' + db + '/' + meta + p, function (error, response, body) {
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
            url: 'http://' + this.cfg.url + '/' + db + '/' + meta, 
            json: data
        }, 
        function(error, httpResponse, body){ 
            callback(error, body)
        }) 
    }

    open(){
        let self = this
        let error = null
        this.ws = new WebSocket('ws://' + this.cfg.url)

        // on open
        this.ws.on('open', function open() {
            // if login is active, then login first and waiting for message before fire the open event
            if( self.cfg.login !== null ){
                self.send_(null, 'login', { value : self.cfg.login } )
            }
            else{
                self.setOpen()
            }
        });
        
        // on error
        this.ws.on('error', function open(e) {
            self.emit('error', e)
            setTimeout(self.open.bind(self), self.reconnectInterval);
        });

        // on close
        this.ws.on('close', function open(e) {
            self.emit('close', e)
            setTimeout(self.open.bind(self), self.reconnectInterval);
        });

        // on message
        this.ws.on('message', function incoming(data) {
            try{
                data =  JSON.parse(data)
                // if message because login, check status if all ok, then fire the open event
                if(!data.err && data.meta === 'login' && data.data.status === 200){
                    self.setOpen()
                }
                else{
                    self.emit(data.meta, data)
                }
            }
            catch(e){
                self.emit('error', e)
            }
        });    
    }

    subscribeWildcard(){
        this.send_(this.cfg.db, 'subscribe', this.cfg.key + '#' )
    }

    unsubscribeWildcard(){
        this.send_(this.cfg.db, 'unsubscribe', this.cfg.key + '#' ) 
    }

    stream(callback){
        // get the data
        this.get_(this.cfg.db, 'stream', 'gte=' + this.cfg.key + '&lte=' + this.cfg.key + '~', function(err, body){
            try{
                callback(null, JSON.parse(body))
            }
            catch(e){
                callback(e, null)
            }     
        })
    }

    push_(meta, data){
        this.send_(this.cfg.db, meta, data)
    }

    pull_(meta, data, callback){
        this.post_(this.cfg.db, meta, data, function(err, data){
            callback(err, data)
        })
    }

    setOpen(){
        if(this.cfg.subscribeWhenOpen){
            this.subscribeWildcard()
        }
        this.emit('open')
    }


    pingpong(){
        let self = this
        this.ws.on('open', this.doHeartbeat);
        this.ws.on('ping', this.doHeartbeat);
        this.ws.on('close', function clear() {
            clearTimeout(self.pingTimeout);
        });
    }

    doHeartbeat() {
        clearTimeout(this.pingTimeout);
        // Use `WebSocket#terminate()` and not `WebSocket#close()`. Delay should be
        // equal to the interval at which your server sends out pings plus a
        // conservative assumption of the latency.
        this.pingTimeout = setTimeout(() => {
        this.ws.terminate();
        }, ( this.cfg.heartbeat || 30000 ) + 5000);
    }

}

module.exports = Connector