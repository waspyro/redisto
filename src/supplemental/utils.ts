export const notEmpty = (args) => {
  args = args.filter(Boolean)
  return args.length ? ':' + args.join(':') : ''
}

export const transformArrayToObject = ([keys, values]) => {
  const obj = {}
  for(let i = 0; i < keys.length; i++) {
    const parts = keys[i].split(':')
    let ref = obj
    let j = 0
    for(; j < parts.length-1; j++) {
      if(!ref[parts[j]]) ref[parts[j]] = {}
      ref = ref[parts[j]]
    }

    if(!values[i]) ref[parts[j]] = null
    else ref[parts[j]] = JSON.parse(values[i])
  }
  return obj;
}

export function objectToKVarray(obj: any, prefix: string = '', keys = [], values = []): any {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      objectToKVarray(obj[key], prefix + key + ':', keys, values);
    } else {
      keys.push(prefix + key)
      values.push(JSON.stringify(obj[key]))
    }
  }
  return [keys, values]
}