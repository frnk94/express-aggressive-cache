# express aggressive cache

[![Coveralls github](https://img.shields.io/coveralls/github/etienne-martin/express-aggressive-cache.svg)](https://coveralls.io/github/etienne-martin/express-aggressive-cache)
[![CircleCI build](https://img.shields.io/circleci/project/github/etienne-martin/express-aggressive-cache.svg)](https://circleci.com/gh/etienne-martin/express-aggressive-cache)
[![node version](https://img.shields.io/node/v/express-aggressive-cache.svg)](https://www.npmjs.com/package/express-aggressive-cache)
[![npm version](https://img.shields.io/npm/v/express-aggressive-cache.svg)](https://www.npmjs.com/package/express-aggressive-cache)
[![npm monthly downloads](https://img.shields.io/npm/dm/express-aggressive-cache.svg)](https://www.npmjs.com/package/express-aggressive-cache)

## Features

- High throughput
- Supports multiple data stores (in-memory and redis)
- Thoroughly tested

## Getting Started

### Installation

To use express-aggressive-cache in your project, run:

```bash
npm install express-aggressive-cache
```

### Usage

**Example** - server-wide caching:

```javascript
import express from "express";
import cache from "express-aggressive-cache";

const app = express();

app.use(cache());

app.get("/hello", (req, res) => {
  res.json({
    hello: "world"
  });
});
```

**Example** - per endpoint caching:

```javascript
import express from "express";
import cache from "express-aggressive-cache";

const app = express();

app.get("/hello", cache(), (req, res) => {
  res.json({
    hello: "world"
  });
});
```

**Example** - limit the amount of entries in the cache:

```javascript
import express from "express";
import cache, { memoryStore } from "express-aggressive-cache";

const app = express();

app.use(
  cache({
    store: memoryStore({
      max: 500
    })
  })
);
```

**Example** - store cache in redis:

```javascript
import express from "express";
import Redis from "ioredis";
import cache, { redisStore } from "express-aggressive-cache";

const app = express();

app.use(
  cache({
    store: redisStore({
      client: new Redis("//localhost:6379"),
      prefix: "api-cache"
    })
  })
);
```

## Options

#### `maxAge`

If the response has a max-age header, it will use it as the TTL.
Value should be provided in seconds.
Otherwise, it will expire the resource using the maxAge option (defaults to Infinity).

#### `store`

Specify a different data store. Default to in-memory caching.

#### `getCacheKey`

Function used to generate cache keys.

#### `debug`

A flag to toggle debug logs. Defaults to false.

## Memory Store

#### `max`

The maximum size of the cache, checked by applying the length function to all values in the cache. Defaults to `Infinity`.

## Redis Store

#### `client`

An instance of redis or a redis compatible client.

Known compatible and tested clients:

- [ioredis](https://www.npmjs.com/package/ioredis)

#### `prefix`

Key prefix in Redis (default: "cache").

This prefix appends to whatever prefix you may have set on the client itself.

Note: You may need unique prefixes for different applications sharing the same Redis instance.

## TypeScript

Type definitions are included in this library and exposed via:

```typescript
import {
  ExpressAggressiveCacheOptions,
  GetCacheKey
} from "express-aggressive-cache";
```

## Built with

- [node.js](https://nodejs.org/en/) - Cross-platform JavaScript run-time environment for executing JavaScript code server-side.
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript that compiles to plain JavaScript.
- [Jest](https://facebook.github.io/jest/) - Delightful JavaScript Testing.

## Contributing

When contributing to this project, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

Update the [README.md](https://github.com/etienne-martin/express-aggressive-cache/blob/master/README.md) with details of changes to the library.

Execute `yarn test` and update the tests if needed.

## Authors

- **Etienne Martin** - _Initial work_ - [etiennemartin.ca](http://etiennemartin.ca/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
