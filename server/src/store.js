import { MongoClient } from 'mongodb';
import { config } from './config.js';

/**
 * Pluggable key/value store with two backends:
 *   - MongoDB   when MONGO_URI is set (persists cache + action queue across restarts)
 *   - in-memory otherwise (zero setup; good for local dev and the public-source MVP)
 *
 * The interface is intentionally tiny so a swap is invisible to callers.
 */

class MemoryStore {
  constructor() {
    this.maps = new Map(); // collection -> Map(key -> doc)
    this.kind = 'memory';
  }
  _col(name) {
    if (!this.maps.has(name)) this.maps.set(name, new Map());
    return this.maps.get(name);
  }
  async get(collection, key) {
    return this._col(collection).get(key) ?? null;
  }
  async set(collection, key, doc) {
    this._col(collection).set(key, { ...doc, _id: key });
  }
  async all(collection) {
    return [...this._col(collection).values()];
  }
  async has(collection, key) {
    return this._col(collection).has(key);
  }
  async close() {}
}

class MongoStore {
  constructor(db, client) {
    this.db = db;
    this.client = client;
    this.kind = 'mongodb';
  }
  async get(collection, key) {
    return this.db.collection(collection).findOne({ _id: key });
  }
  async set(collection, key, doc) {
    await this.db
      .collection(collection)
      .updateOne({ _id: key }, { $set: { ...doc, _id: key } }, { upsert: true });
  }
  async all(collection) {
    return this.db.collection(collection).find({}).toArray();
  }
  async has(collection, key) {
    return (await this.db.collection(collection).countDocuments({ _id: key }, { limit: 1 })) > 0;
  }
  async close() {
    await this.client.close();
  }
}

let storePromise;

export function getStore() {
  if (storePromise) return storePromise;
  storePromise = (async () => {
    if (config.mongoUri) {
      try {
        const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 4000 });
        await client.connect();
        await client.db(config.mongoDb).command({ ping: 1 });
        console.log('[store] connected to MongoDB');
        return new MongoStore(client.db(config.mongoDb), client);
      } catch (err) {
        console.warn(`[store] MongoDB unavailable (${err.message}); falling back to in-memory`);
      }
    } else {
      console.log('[store] no MONGO_URI set; using in-memory store');
    }
    return new MemoryStore();
  })();
  return storePromise;
}
