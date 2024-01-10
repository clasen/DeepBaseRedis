import { createClient } from 'redis';
import { customAlphabet } from 'nanoid'

export default class DeepBaseRedis {

    constructor(opts = {}) {
        this.nidAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        this.nidLength = 10;
        this.name = "db";
        this.url = "redis://localhost:6379";
        Object.assign(this, opts)

        this.nanoid = customAlphabet(this.nidAlphabet, this.nidLength)
        this.client = createClient({ url: this.url });
    }

    async disconnect() {
        await this.client.disconnect();
    }

    async connect() {
        await this.client.connect();
    }

    async set(...args) {
        if (args.length < 2) return
        const keys = args.slice(0, -1)
        const value = args[args.length - 1]

        const key = keys.shift()
        const keyPath = keys.length == 0 ? "." : keys.join('.')
        await this._set(key, keyPath, value);
        return args.slice(0, -1)
    }

    async _set(key, path, value) {

        if (value === undefined) {
            await this.client.json.del(this.name + ":" + key, path);
            return;
        }

        let r = null;
        try {
            r = await this.client.json.set(this.name + ":" + key, path, value);
        } catch (error) {

        }

        if (r === null) {
            const keys = path.split('.');
            keys.pop();
            const keyPath = keys.length == 0 ? "." : keys.join('.')
            await this._set(key, keyPath, {});
            await this._set(key, path, value);
        }
    }

    async get(...args) {

        if (args.length == 0) return null

        const key = args.shift()
        const path = args.length == 0 ? "." : args.join('.');

        let r = null
        try {
            r = await this.client.json.get(this.name + ":" + key, { path });
        } catch (error) {

        }
        return r;
    }

    async keys(...args) {
        const r = await this.get(...args)
        return (r !== null && typeof r === "object") ? Object.keys(r) : [];
    }

    async upd(...args) {
        const func = args.pop()
        return this.set(...args, func(await this.get(...args)))
    }

    async inc(...args) {

        const i = args.pop()
        const key = args.shift()
        const path = args.length == 0 ? "." : args.join('.')

        try {
            await this.client.json.numIncrBy(this.name + ":" + key, path, i);
            return args.slice(0, -1)
        } catch (error) {
            args.unshift(key)
            return this.upd(...args, n => n + i)
        }
    }

    async dec(...args) {
        const i = args.pop()
        args.push(-i)
        return this.inc(...args)
    }

    async del(...args) {
        const key = args.shift()
        const path = args.length == 0 ? "." : args.join('.')
        await this.client.json.del(this.name + ":" + key, path);
        return [key, ...args]
    }

    async add(...keys) {
        const value = keys.pop();
        const id = this.nanoid();
        await this.set(...[...keys, id, value])
        return [...keys, id]
    }
}

// const mem = new DeepBaseRedis();

// await mem.del('a')

// await mem.add('a', 'b', 'c', 1)
// await mem.add('a', 'b', 'c', 1)
// await mem.get('a', 'b', 'c')

// await mem.set('a', 'b', 'a', 1)
// await mem.set('a', 'c', 'a', 1)
// await mem.del('a', 'c', 'a', 1)

// console.log(await mem.get('a'))

// await client.quit();