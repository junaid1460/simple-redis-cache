import { RedisClient, ClientOpts, createClient } from "redis";

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

export class RedisCache {
    
    public redisClient: RedisClient;
    constructor(options: ClientOpts) { 
        this.redisClient = createClient(options)
    }

    public async cached<T>(args: ICachedFuncInput<T>): Promise<ICachedFuncOutput<T>> {
        const { expiresAfter, func, keys } = args;
        const redisKey = keys.join(":");
        const cache = await this.redisGet(redisKey).catch((e) => undefined);
        if (cache !== undefined) {
            return {
                data: cache as T,
                hit: true,
            };
        }
        const data = await func();
        await this.redisSet(redisKey, data, expiresAfter);
        return {
            data: data,
            hit: false,
        };
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
