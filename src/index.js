"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class RedisCache {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    cached(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { expiresAfter, func, keys } = args;
            const redisKey = keys.join(":");
            const cache = yield this.redisGet(redisKey).catch((e) => undefined);
            if (cache !== undefined) {
                return {
                    data: cache,
                    hit: true,
                };
            }
            const data = yield func();
            yield this.redisSet(redisKey, data, expiresAfter);
            return {
                data: data,
                hit: false,
            };
        });
    }
    redisGet(redisKey) {
        return new Promise((resolve, reject) => {
            this.redisClient.get(redisKey, (error, data) => {
                if (error || !data) {
                    return reject();
                }
                const cache = JSON.parse(data);
                resolve(cache.data);
            });
        });
    }
    redisSet(redisKey, data, expiresAfter) {
        return new Promise((resolve, __) => {
            const multiOperations = this.redisClient.multi();
            const cache = JSON.stringify({ data: data });
            multiOperations.set(redisKey, cache);
            multiOperations.expire(redisKey, expiresAfter);
            multiOperations.exec_atomic((error, _) => {
                return resolve(true);
            });
        });
    }
}
exports.RedisCache = RedisCache;
