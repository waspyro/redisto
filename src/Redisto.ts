import Redis, {RedisOptions} from "ioredis";
import {objectToKVarray, transformArrayToObject} from "./supplemental/utils";
import cmdloader from "./supplemental/cmdloader";

export default class Redisto {

  constructor(
    public readonly client: Redis = new Redis(),
    public readonly prefix: string = '@'
  ) {}

  key = (relativeKey: string) => {
    if(relativeKey.length === 0) return this.prefix
    return this.prefix + ':' + relativeKey
  }

  set = (path: string|any, value?: any): Promise<number> => {
    if(value === undefined) (value = path, path = this.prefix)
    else path = this.key(path)
    const keys = [path]
    const values = []
    if(typeof value !== 'object' || value === null)
      values.push(JSON.stringify(value))
    else
      objectToKVarray(value, '', keys, values)
    return this.client.omset(keys.length, keys, values)
  }

  oget = (key: string = '', assignTo = {}): Promise<Object> => {
    return this.client.oget(this.key(key)).then(res => {
      if(!Array.isArray(res)) throw new Error('unexpected response')
      return transformArrayToObject(res, assignTo)
    })
  }

  get = (key: string = '') => {
    return this.client.get(this.key(key))
      .then(JSON.parse)
  }

  col = (...args: string[]): Redisto => {
    return new Redisto(this.client, this.key(args.join(':')))
  }

  static init = (opts: RedisOptions & {route?: string} = {}) => {
    const redis = cmdloader(new Redis(opts))
    return new Redisto(redis, opts.route)
  }

  static defineRedisCommands = (client: Redis) => {
    return cmdloader(client)
  }

}