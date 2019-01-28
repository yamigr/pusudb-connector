# pusudb-connector

> Create a connector for the pusudb-framework.

Framework: [https://www.npmjs.com/package/pusudb](https://www.npmjs.com/package/pusudb)

Define the configuration and open the connection. When a key is subscribed, then each event will be fired according the meta. Check the pusudb docs for the metas.

<a name="installing"></a>
## Installing

```sh
npm install pusudb-connector --save
```

## Use

Options
* key of the pusudb-connector-instance 
* db is the db-name where the pusudb stores the data
* url of the [pusudb](https://www.npmjs.com/package/pusudb)
* login-object of the [pusudb-use-auth-jwt](https://www.npmjs.com/package/pusudb-use-auth-jwt)
* subscribeWhenOpen if true, then the key will be subscribed when the connection is open

```js

const Connector = require('pusudb-connector')

// Create instance
let connectComponent = new Connector({ key : 'sensor:rapport', 
                                       db : 'component', 
                                       url : '192.168.178.20:3000/api', 
                                       login : { email : '', password: '' }, // or null when no login required, check object in pusudb
                                       subscribeWhenOpen : true
})

// Create connection 
connectComponent.open()

// Fired when the connection is open
connectComponent.on('open', function(){

    // subscribe the defined key in the defined db
    //connectComponent.subscribeWildcard()

    // unsubscribe the defined key in the defined db
    //connectComponent.unsubscribeWildcard()

    // get all entries by key
    connectComponent.stream(function(err, data){
        console.log(data)
        /*
            {
            "err": null, // error message
            "db": "db", // db name
            "meta": "update", // or others
            "data": [{key : '', value : ''}, ...] // see pusudb-api doc
            }
        */
    })
})


// Fired when the db entry has changed by put
connectComponent.on('put', function(data){

    console.log('put message:', data)
    /*
        {
        "err": null, // error message
        "db": "db", // db name
        "meta": "update", // or others
        "data": { key : '', value : 'all values'} // see pusudb-api doc
        }
    */
})

// Fired when the db entry has changed by update
connectComponent.on('update', function(data){

    console.log('update message:', data)
    /*
        {
        "err": null, // error message
        "db": "db", // db name
        "meta": "update", // or others
        "data": { key : '', value : 'only the specific updated value'} // see pusudb-api doc
        }
    */
})

// Fired when the db entry has changed by delete
connectComponent.on('del', function(data){

    console.log('delete message:', data)
    /*
        {
        "err": null, // error message
        "db": "db", // db name
        "meta": "del", // or others
        "data": 'key' // see pusudb-api doc
        }
    */
})


// Fired when the db entry has changed by batch
connectComponent.on('batch', function(data){

    console.log('batch message:', data)
    /*
        {
        "err": null, // error message
        "db": "db", // db name
        "meta": "update", // or others
        "data": [{ key : '', value : 'all values'},...] // see pusudb-api doc
        }
    */
})

// Fired when the db entry has changed by batch
connectComponent.on('publish', function(data){

    console.log('publish message:', data)
    /*
        {
        "err": null, // error message
        "db": "db", // db name
        "meta": "update", // or others
        "data": [{ key : '', value : 'all values'},...] // see pusudb-api doc
        }
    */
})

// Fired when the websocket is closed. It will try to reconnet every 10s.
// Change interval connectComponent.reconnectInterval = ...ms
connectComponent.on('close', function(e){
    console.error(e)
})

// Fired when an error occurred
connectComponent.on('error', function(err){
    console.error(err)
})


connectComponent.ws.on('ping', /* heartbeat function like this one from package ws */)

/********************************************************/
// QUERY API

// webscoket Push data direct to the defined db in cfg
connectComponent.push_('update' /*or 'publish', 'put', ... see pusudb-metas*/, { key : data.key, value : data.value})
// http Pull data direct from the defined db in cfg,
connectComponent.pull_('stream' /*or 'publish', 'put', ... see pusudb-metas*/, { gte : 'bla:', lte: 'bla:~'}, function(err, data){
    // handle err or json-data
})


// http Get query arguments = db, meta, params, callback
connectComponent.get_('db', 'stream' /*or 'publish', 'put', ... see pusudb-metas*/, 'gte=componentA&lte=componentA~', function(err, body){
    try{
        body = JSON.parse(body)
    }
    catch(e){
        console.error(e)
    }     
})

// Post query arguments = db, meta, json-data
connectComponent.post_('db', 'put', json, function(err, data){

})

// Websocket query arguments = db, meta, json-data
connectComponent.send_('db', 'get', json )

```

<a name="authors"></a>

## Authors

* **Yannick Grund** - *Initial work* - [yamigr](https://github.com/yamigr)

<a name="license"></a>

## License

This project is licensed under the MIT License

