/* eslint-env mocha */

import DeepBase from '../index.mjs';
import assert from 'assert';

describe('DeepBaseRedis', () => {
    let db;

    beforeEach(async () => {
        db = new DeepBase({ name: 'test' });
        await db.connect();
    });

    afterEach(async () => {
        await db.del('foo');
        await db.disconnect();
    });

    describe('#set()', () => {
        it('should set a value at a given path', async () => {
            await db.set('foo', 'bar', 'baz');
            const baz = await db.get('foo', 'bar');
            assert.deepEqual(baz, 'baz');
        });

        it('should overwrite an existing value at the same path', async () => {
            await db.set('foo', 'bar', 'baz');
            await db.set('foo', 'bar', 'qux');
            const qux = await db.get('foo', 'bar')
            assert.deepEqual(qux, 'qux');
        });

        it('should do nothing if no value is provided', async () => {
            await db.set('foo', 'bar');
            await db.set('foo', 'bar', undefined);
            const udf = await db.get('foo', 'bar');
            assert.deepEqual(udf, undefined);
        });

        it('should save changes to Redis', async () => {
            await db.set('foo', 'bar', 'baz');
            db = new DeepBase({ name: 'test' }); // create a new instance to reload the saved data
            await db.connect();
            const baz = await db.get('foo', 'bar');
            assert.deepEqual(baz, 'baz');
        });
    });

    describe('#get()', () => {
        it('should retrieve a value at a given path', async () => {
            await db.set('foo', 'bar', 'baz');
            assert.deepEqual(await db.get('foo', 'bar'), 'baz');
        });

        it('should return null if the value does not exist', async () => {
            assert.deepEqual(await db.get('foo', 'bar'), null);
        });

        it('should return null if no keys are provided', async () => {
            assert.deepEqual(await db.get(), null);
        });
    });

    describe('#del()', () => {
        it('should delete a value at a given path', async () => {
            await db.set('foo', 'bar', 'baz');
            await db.del('foo', 'bar');
            assert.deepEqual(await db.get('foo', 'bar'), null);
        });

        it('should do nothing if the value does not exist', async () => {
            await db.del('foo', 'bar');
            assert.deepEqual(await db.get('foo', 'bar'), null);
        });

        it('should save changes to Redis', async () => {
            await db.set('foo', 'bar', 'baz');
            await db.del('foo', 'bar');
            db = new DeepBase({ name: 'test' }); // create a new instance to reload the saved data
            await db.connect();
            assert.deepEqual(await db.get('foo', 'bar'), null);
        });
    });

    describe('#add()', () => {

        it('should save changes to Redis', async () => {
            const obj = { bar: 'baz' }
            const path = await db.add('foo', obj);
            assert.deepEqual(await db.get(...path), obj);
        });
    });

    describe('#inc()', () => {

        it('should increment a value at a given path', async () => {
            await db.set('foo', 'bar', 1);
            await db.inc('foo', 'bar', 2);
            assert.deepEqual(await db.get('foo', 'bar'), 3);
        });
    });

    describe('#dec()', () => {

        it('should save changes to Redis', async () => {
            await db.set('foo', 'bar', 3);
            await db.dec('foo', 'bar', 2);
            db = new DeepBase({ name: 'test' }); // create a new instance to reload the saved data
            await db.connect();
            assert.deepEqual(await db.get('foo', 'bar'), 1);
        });

        it('should set the value to -1 if it does not exist', async () => {
            await db.dec('foo', 'bar', 2);
            assert.deepEqual(await db.get('foo', 'bar'), -2);
        });
    });

    describe('#keys()', () => {

        it('should return keys', async () => {
            await db.set('foo', 'bar', 1);
            await db.set('foo', 'quux', 1);
            assert.deepEqual(await db.keys('foo'), ['bar', 'quux']);
        });
    });

    describe('#upd()', async () => {

        it('should update field keys', async () => {
            await db.set('foo', 'bar', 2);
            await db.upd('foo', 'bar', n => n * 3);
            assert.deepEqual(await db.get('foo', 'bar'), 6);
        });
    });

    
});