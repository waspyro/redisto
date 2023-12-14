import {Result, Callback} from "ioredis";
export declare module "ioredis" {
  interface RedisCommander<Context> {
    omset(
      num: number,
      key: string[],
      values: string[],
      callback?: Callback<number>
    ): Result<number, Context>;
    oget(
      key: string,
      callback?: Callback<string>
    ): Result<string | [string[], string[]], Context>;
  }
}
