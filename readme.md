# Senior Backend Engineer Tech Challenge

This service allows you to lookup a given vehicle state from the sellers logs from a given timestamp (ISO 8601)

- [Senior Backend Engineer Tech Challenge](#senior-backend-engineer-tech-challenge)
	- [Requirements](#requirements)
	- [Setup](#setup)
		- [Development ENV](#development-env)
		- [Testing ENV](#testing-env)
		- [Local development](#local-development)
		- [Production build](#production-build)
	- [Cache layer](#cache-layer)
	- [Logging](#logging)
	- [Folder Structure](#folder-structure)
	- [Testing](#testing)
		- [Linting/Formatting](#lintingformatting)
	- [Database](#database)
		- [Generating Types](#generating-types)
	- [Tracing](#tracing)


## Requirements
- [docker](https://docs.docker.com/get-docker/)
- [node v20](https://nodejs.org/en/download)
- [make](https://www.gnu.org/software/make/) - if you're on a mac you should already have this installed

## Setup
To setup the service you will need to perform the following steps

### Development ENV

**Please note that the following environment variables are required to run the service**

| env              | value           |
| ---------------- | --------------- |
| PORT						 | 4000            |
| DB_USER          | user            |
| DB_PASSWORD      | password        |
| DB_NAME          | motoway         |
| DB_HOST          | localhost       |
| DB_PORT          | 5432            |
| MEMCACHE_SERVERS | localhost:11211 |
| LOG_LEVEL        | info            |


### Testing ENV

| env                   | value           |
| --------------------- | --------------- |
| TEST_DB_USER          | user            |
| TEST_DB_PASSWORD      | password        |
| TEST_DB_NAME          | motoway_test    |
| TEST_DB_HOST          | localhost       |
| TEST_DB_PORT          | 5433            |
| TEST_MEMCACHE_SERVERS | localhost:11211 |

### Local development

1. run npm install
2. create your `.env` file - you can copy the [.env.template](/.env.template) file
3. run `make dockerComposeUp` to start the database and memcache server and to spin down the services run `make dockerComposeDown`
4. run `npm run dev` to start the service <a href="http://localhost:4000/api/v1">localhost:4000/api/v1</a>

Once you're up and running in development mode you can also access the swagger docs at <a href="http://localhost:4000/api/v1/docs">localhost:4000/api/v1/docs</a>.
 **Please note that the swagger docs are not available in production mode**


### Production build

1. `docker build -f Dockerfile.server -t vehicle-state-service .`

Although you could also run production mode using the docker-compose file. This is just demonstrating how you can build the docker image for production. You could publish this image to a registry and deploy it to a kubernetes cluster or any other container orchestration tool.


## Cache layer
To handle repeating requests and to offload redundant requests to the database, I have implemented a memcache layer. This layer is used to store the results of the database queries for a given vehicle state and timestamp. The cache is set to expire after 1 minute. This means that if the same request is made within 1 minute of the first request, the service will return the result from the cache rather than querying the database again.

## Logging
The service uses the winston logger to log information to the console. The logger is configured to log to the console and to a file. The log level is set to info by default but can be changed by setting the LOG_LEVEL environment variable.

Each layer of the service has it's own log level, this allows us to understand the trace of the request through the system. The log levels are as follows:
- **Config** - extracting the configuration values from the environment variables
- **Routes** - logging the incoming requests
- **Controllers** - logging the request validation and the response
- **Services** - logging the business logic
- **Store** - logging the data access logic
- **Cache** - logging the cache layer


## Folder Structure

This service follows a 3 layer architecture design pattern. The service is split into the following layers:

- **Controllers**: This layer is responsible for handling the incoming requests and returning the responses. It also contains the request validation logic.
- **Services**: This layer is responsible for handling the business logic. It is the layer that interacts with the store layer.
- **Store**: This layer is responsible for handling the data access logic. It is the layer that interacts with the database.

The service also contains a `middleware` folder which contains the requestIdMiddleware. This middleware is responsible for adding a unique request id to each request. This request id is then used to track the request through the system.

The service also contains a `utils` folder which contains the Error class and the Memcache class. The Error class is used to create custom errors and the Memcache class is used to interact with the memcache server.

```
.
├── config
│   ├── config.ts
│   ├── database.ts
│   └── logger.ts
├── controllers
│   └── vehicles
│       ├── tests
│       │   ├── validators.test.ts
│       │   └── vehicles.test.ts
│       ├── validators.ts
│       └── vehicles.ts
├── generated
│   └── types
│       └── public
│           ├── StateLogs.ts
│           └── Vehicles.ts
├── index.ts
├── middleware
│   ├── requestIdMiddleware.ts
│   └── tests
│       └── requestIdMiddleware.test.ts
├── routes
│   └── index.ts
├── server.ts
├── services
│   └── vehicles
│       ├── service.ts
│       └── tests
│           └── service.test.ts
├── store
│   └── vehicles
│       ├── store.ts
│       └── tests
│           └── store.test.ts
├── types
│   └── controllers.ts
└── utils
    ├── Errors
    │   └── Error.ts
    └── Memcache
        └── Memcache.ts
```

## Testing
This service uses jest with supertest for testing. Each layer of the service has it's own test folder when the tests are located.

The strategy for the tests are not to mock any critical paths of the system which is while you will see we have a test database that we use to run the tests against. This allows us to test the full system without mocking any critical paths. Overall this will give us a better understanding of how the system will behave in a production environment.

To run the tests you have two modes:
- `npm run test` - this will run the tests once
- `npm run test:watch` - this will run the tests in watch mode


### Linting/Formatting
This service uses eslint and prettier for its linting and formatting rules to ensure consistency regardless of the amount of engineers working within the codebase.

To run the linting and formatting you can run the following commands:
- `npm run lint` - this will run the linting rules
- `npm run format` - this will run the formatting rules


## Database
The database that will be spun up is a postgres database. The database will be seeded with data upon docker compose using a dump file found in the scripts folder.

Packages used to interact with the database:
- node-postgres

This service does't use an ORM as the queries are simple and can be written in raw SQL. This allows us to have more control over the queries and to write more efficient queries.

It also allows us to expand the queries as the system grows without having to worry about the ORM not supporting the query we want to write or adding bloated queries to the system.

The drawback however doesn't mean we could be more prone to SQL injection attacks. This is why we use ensure we have proper validation and sanitization of the inputs to the queries.

### Generating Types
This service generates it's database types using [kanel](https://github.com/kristiandupont/kanel)


## Tracing
This service uses OpenTelemetry to trace the requests through the system. The traces are sent to a Jaeger instance which is spun up using docker-compose. The traces are sent to Jaeger using an [otel-collector](./docker/otel-collector-config.yml) seen in the docker folder.

To view the traces in local development or production mode you can access the Jaeger UI at <a href="http://localhost:16686">localhost:16686</a>