import { ClientOpts, createClient, RedisClient } from "redis";

interface ICache {
    data: any;
}

interface ICachedFuncInput<T> {
    func: () => Promise<T>;
    keys: Array<string | number>;
    expiresAfter: number;
}

interface ICachedFuncOutput<T> {
    hit: boolean;
    data: T;
}

class CacheItem<T> {
    constructor(private redisClient: RedisClient, private args: ICachedFuncInput<T>) {
        
    }

    private getKey() {
        return this.args.keys.join(":")
    }

    async get(): Promise<T> {
        const { expiresAfter, func } = this.args;
        const redisKey = this.getKey()
        const cache = await this.redisGet(redisKey).catch((e) => undefined);
        if (cache !== undefined) {
            return cache as T
        }
        const data = await func();
        await this.redisSet(redisKey, data, expiresAfter);
        return data
    }

    delete() {
        return new Promise((resolve, reject) => {
            this.redisClient.DEL(this.getKey(), (error, data) => {
                resolve(data)
            })
        })
    }

    private redisGet(redisKey: string) {
        return new Promise((resolve, reject) => {
            this.redisClient.get(redisKey, (error, data) => {
                if (error || !data) {
                    return reject();
                }
                const cache: ICache = JSON.parse(data) as any;
                resolve(cache.data as any);
            });
        });
    }

    private redisSet(redisKey: string, data: any, expiresAfter: number) {
        return new Promise((resolve, __) => {
            const multiOperations = this.redisClient.multi();
            const cache = JSON.stringify({ data: data } as ICache);
            multiOperations.set(redisKey, cache);
            multiOperations.expire(redisKey, expiresAfter);
            multiOperations.exec_atomic((error, _) => {
                return resolve(true);
            });
        });
    }
}

export class RedisCache {

    public redisClient: RedisClient;
    constructor(options: ClientOpts) { 
        this.redisClient = createClient(options);
    }

    public cached<T>(args: ICachedFuncInput<T>): CacheItem<T> {
        return new CacheItem(this.redisClient, args)
    }
}
