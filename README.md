# pusudb-connector

> Create connector-drivers for the pusudb-framework.

Define the configuration and run the connector. For each configuration it starts a connector instances. To handle the data received by the pusudb listen to the events described below. The event message will be fired, everytime when someone put, update or publish a entry in the certain db and the defined key as substring. When the method run is called, it querying first the pusudb and streams all the entries which contains the key defined in the configuration. 

Framework: [https://www.npmjs.com/package/pusudb](https://www.npmjs.com/package/pusudb)

<a name="installing"></a>
## Installing

```sh
npm install pusudb-connector --save
```

## Use


```js

const Connector = require('pusudb-connector')

// Configuration
let cfg = [
    { key : 'component:client', db : 'component', url : 'localhost:3000/api', username : '', password : ''}, 
    { key : 'process:client', db : 'process', url : 'localhost:3000/api', username : '', password : ''}
]


let connector = new Connector(cfg)

connector.run(function(err){

    console.log('done')
    // all components
    console.log(connector.db['component'].data)
    // all processes
    console.log(connector.db['process'].data)

    /***************QUERY*****************/
    // post db, meta, data
    connector.db['component'].postData('layout', 'put', { key : 'schema:component', value: 'some-value'}, function(err, data){
        console.log(err, data)
    })
    // get query db, meta, get-params
    connector.db['component'].getData('layout', 'stream', 'gte=schema:&lte=schema~', function(err, data){
        console.log(err, data)
    })
    // websocket send db, meta, data
    connector.db['component'].sendData('component', 'update', { key : 'some:client', value : 'some-value'})


    /***************EVENTS*****************/


    // handle message for db component
    connector.db['component'].on('message', function(msg){
        console.error('component message:', msg)
    })

    // handle error for db component
    connector.db['component'].on('error', function(err){
        console.error('component err:', err)
    })

    // handle messages for db process
    connector.db['process'].on('message', function(msg){
        console.error('process message:', msg)
    })

    // handle error for db process
    connector.db['process'].on('error', function(err){
        console.error('process err:', err)
    })
})

```

<a name="authors"></a>

## Authors

* **Yannick Grund** - *Initial work* - [yamigr](https://github.com/yamigr)

<a name="license"></a>

## License

This project is licensed under the MIT License

