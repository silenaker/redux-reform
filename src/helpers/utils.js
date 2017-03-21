import deepAssign from 'deep-assign'
import unset from 'lodash.unset'

export function isString(s) {
  return typeof s === 'string'
}

export function isObject(value) {
  var type = typeof value
  return value != null && (type == 'object' || type == 'function')
}

export function isFunction(fn) {
  return Object.prototype.toString.call(fn) === '[object Function]'
}

export function isPromise(obj) {
  return isObject(obj) && obj.then && isFunction(obj.then)
}

export function parseString(value) {
  if (typeof value !== 'string') return value
  if (/^[0-9]+$/.test(value)) return +value
  if (/^true|false$/.test(value)) return value === 'true'
  if (/^\s*(\w+\s*,\s*)+(\w+\s*)$/.test(value)) {
    return value.split(/\s*,\s*/).map(parseString)
  }
  return value
}

export function immutableAssign(source, target) {
  if (
    target === source ||
    target === undefined
  ) {
    return source
  }
  
  if (Array.isArray(source)) {
    if (Array.isArray(target)) {
      return target
    } else if (isObject(target)) {
      if (target.hasOwnProperty('__replace__') && target.__replace__) {
        delete target.__replace__
        return target
      }
      let ret
      for (let key in target) {
        if (target.hasOwnProperty(key)) {
          key = +key
          if (typeof key === 'number' && !isNaN(key)) {
            const result = immutableAssign(source[key], target[key])
            if (result === source[key]) continue
            (ret = ret || { ...source })[key] = result
          }
        }
      }
      return ret || source
    } else {
      return source
    }
  } else if (isObject(source)) {
    if (isObject(target)) {
      if (target.hasOwnProperty('__replace__') && target.__replace__) {
        delete target.__replace__
        return target
      }
      let ret
      for (let key in target) {
        if (target.hasOwnProperty(key)) {
          const result = immutableAssign(source[key], target[key])
          if (result === source[key]) continue
          (ret = ret || { ...source })[key] = result
        }
      }
      return ret || source
    } else {
      return source
    }
  } else {
    return target
  }
}

export function immutableDelete(target, path) {
  const copy = deepAssign({}, target)
  unset(copy, path)
  return copy
}

export function fillObject(obj, value) {
  const ret = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (isObject(obj[key])) {
        ret[key] = fillObject(obj[key], value)
      } else {
        ret[key] = value
      }
    }
  }
  return ret
}