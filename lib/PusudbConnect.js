const EventEmitter = require('events')
const async = require('async')
const Connector = require('./Connector')

const exampleconfig = [
    { key : 'mqtt:client', db : 'component', url : 'localhost:3000/api', username : '', password : ''}, 
    { key : 'mqtt:client', db : 'process', url : 'localhost:3000/api', username : '', password : ''}
]

class PusudbConnector  {

    constructor(cfg){

        if(typeof cfg !== 'object') throw new Error('no configuration is set. Example: ' + JSON.stringify(exampleconfig, null, 2))
        this.db = {}
        this.configuration = cfg || {}
    }

    run(callback){
        let self = this
        async.forEach(this.configuration, function(element, next){

            self.db[element.db] = new Connector(element)

            self.db[element.db].init(function(err){
                next(err)
            })

        }, function(err){
            callback(err)
        })
    }

}

module.exports = PusudbConnector