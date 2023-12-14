import Redis, {RedisOptions} from "ioredis";
import {notEmpty, objectToKVarray, transformArrayToObject} from "./supplemental/utils";
import cmdloader from "./supplemental/cmdloader";

export default class Redisto {

  constructor(
    public readonly client: Redis = new Redis(),
    public readonly prefix: string = '@'
  ) {}

  set = (...args: [...string[], any]): Promise<number> => {
    const value = args.pop()

    const keys = [this.prefix + notEmpty(args)]
    const values = []
    if(typeof value !== 'object' || value === null)
      values.push(JSON.stringify(value))
    else
      objectToKVarray(value, '', keys, values)
    return this.client.omset(keys.length, keys, values)
  }

  get = (...args: string[]): Promise<any> => {
    const path = this.prefix + notEmpty(args)
    return this.client.oget(path).then(res => {
      if(!Array.isArray(res)) return JSON.parse(res)
      return transformArrayToObject(res)
    })
  }

  col = (...args: string[]): Redisto => {
    return new Redisto(this.client, this.prefix + notEmpty(args))
  }

  static init = (opts: RedisOptions & {route?: string} = {}) => {
    const redis = cmdloader(new Redis(opts))
    return new Redisto(redis, opts.route)
  }

  static defineRedisCommands = (client: Redis) => {
    return cmdloader(client)
  }

}