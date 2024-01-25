const { createClient } = require('redis');
const { customAlphabet } = require('nanoid');

class DeepBaseRedis {

    constructor(opts = {}) {
        this.nidAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        this.nidLength = 10;
        this.name = "db";
        this.url = "redis://localhost:6379";
        this.client = createClient({ url: this.url });
        this.nanoid = customAlphabet(this.nidAlphabet, this.nidLength)
        Object.assign(this, opts)
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

        if (args.length === 0) {

            const dic = {}
            for (let key of await this._zeroKeys()) {
                dic[key] = await this.get(key);
            }
            return dic;
        }

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

    async values(...args) {
        const r = await this.get(...args)
        return (r !== null && typeof r === "object") ? Object.values(r) : [];
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

    async _zeroKeys() {
        const scan = {
            TYPE: 'ReJSON-RL',
            MATCH: this.name + ':*',
            COUNT: 1000,
        }

        const keys = []
        for await (let key of this.client.scanIterator(scan)) {
            keys.push(key.substring(this.name.length + 1));
        }

        return keys;
    }

    async del(...args) {

        if (args.length === 0) {

            for (let key of await this._zeroKeys()) {
                await this.del(key);
            }
        }

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

module.exports = DeepBaseRedis;