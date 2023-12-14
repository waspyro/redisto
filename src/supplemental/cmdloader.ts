import Redis from "ioredis";
import fs from 'fs'

const  oget =  fs.readFileSync(__dirname + '/../lua/oget.lua', 'utf-8')
const  omset = fs.readFileSync(__dirname + '/../lua/omset.lua', 'utf-8')

export default (client: Redis) => {
  client.defineCommand('oget', {
    numberOfKeys: 1,
    lua: oget
  })
  client.defineCommand('omset', {
    lua: omset
  })
  return client
}