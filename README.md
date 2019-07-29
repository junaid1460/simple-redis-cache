## Simple redis cache
<span class="badge-npmversion"><a href="https://www.npmjs.com/package/@junaid1460/simple-redis-cache" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@junaid1460/simple-redis-cache.svg" alt="NPM version" /></a></span>
Cache data easily with a simple wrap.

```shell

npm i @junaid1460/simple-redis-cache
```

### Usage

##### typescript:

``` typescript
import { RedisCache } from "@junaid1460/simple-redis-cache";

const cache = new RedisCache({
    host: "localhost",
});

function myFunc(x: number, y: number) {
    return cache.cached({
        expiresAfter: 10, // seconds
        keys: [x, y], // list of number or string to construct key
        // closure
        func: async () => {
            return x * y;
        },
    });
}

myFunc(1, 2).get().then((e) => console.log(e.hit, e.data));
```

##### Javascript:
```javascript

const redisCache = require('@junaid1460/simple-redis-cache')
const cache = new redisCache.RedisCache({
    host: 'localhost'
})


function myFunc(x, y) {
    return cache.cached({
        expiresAfter: 10, // seconds
        keys: [x, y], // list of number or string to construct key
        // closure
        func: async () => {
            return x * y;
        },
    });
}

myFunc(1, 2).delete().then((e) => console.log());
```