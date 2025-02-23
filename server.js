const hapi = require('hapi');
const inert = require('inert');
const Path = require('path');
const vision = require('vision');
const handlebars = require('handlebars')

// database connection to local sqlite
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './stock'
    },
    useNullAsDefault: true
});


const server = new hapi.Server()

server.register([vision, inert], function (err) {
    if (err) {
        console.log('connot register vision');
    }
});

server.connection(
    {
        host: 'localhost',
        port: 3000
    }
);

//for serving the html templates on single page application
server.views({
    engines: {
        html: handlebars
    },
    path: __dirname + '/views',
    partialsPath: 'views/partials'
})

server.route({
    path: "/views/{path*}",
    method: "GET",
    handler: {
        directory: {
            path: './views',
            listing: false,
            index: true
        }
    }
});

server.route({
    path: "/mod/{path*}",
    method: "GET",
    handler: {
        directory: {
            path: './node_modules',
            listing: false,
            index: true
        }
    }
});


server.route({
    path: "/static/{path*}",
    method: "GET",
    handler: {
        directory: {
            path: './static',
            listing: false,
            index: true
        }
    }
});

// query endpoint for the getting all the result, this will act as a api endpoint
server.route({
    method: 'GET',
    path: '/query',
    handler: function (request, reply) {
        reply(knex.select('price', knex.raw('SUM(size) as size')).from('daily_stock')
        .where({ 'sym': request.query.sym })
        .andWhere('time', '>=', request.query.startTime)
        .andWhere('time', '<=', request.query.endTime)
        .groupByRaw(['price'])
        .orderBy('size', 'desc')
        .then(function (data) { return data })
       )
    }
})

//landing page
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.view('index');
    }
});

//partial page
server.route({
    method: 'GET',
    path: '/{path*}',
    handler: function (request, reply) {
        reply.view('index', request.params.path);
    }
});

//starting server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running @: ' + server.info.uri)
})
