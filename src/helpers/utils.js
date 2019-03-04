import deepAssign from 'deep-assign'
import unset from 'lodash.unset'

export function isString(s) {
  return typeof s === 'string'
}

export function isObject(value) {
  var type = typeof value
  return value != null && (type == 'object' || type == 'function')
}

export function isPlainObject(o) {
  var ctor, prot
  if (isObject(o) === false) return false
  ctor = o.constructor
  if (typeof ctor !== 'function') return false
  prot = ctor.prototype
  if (isObject(prot) === false) return false
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false
  }
  return true
}

export function isFunction(fn) {
  return Object.prototype.toString.call(fn) === '[object Function]'
}

export function isPromise(obj) {
  return isObject(obj) && obj.then && isFunction(obj.then)
}

export function parseString(value, type) {
  if (typeof value !== 'string' || !type) return value
  if (type === 'string') return value
  if (type === 'number') return value && Number(value)
  if (type === 'bool') return value === 'true'

  const arrayMatch = type.match(/^array(?:Of(\w+))?$/)
  if (arrayMatch) {
    return value
      .split(/\s*,\s*/)
      .map(val =>
        parseString(val, arrayMatch[1] && arrayMatch[1].toLowerCase())
      )
  }

  return value
}

export function immutableAssign(source, target) {
  if (target === source || target === undefined) {
    return source
  }

  if (isPlainObject(target)) {
    let ret,
      force = target.hasOwnProperty('__force__') && target.__force__
    delete target.__force__

    if (target.hasOwnProperty('__replace__') && target.__replace__) {
      delete target.__replace__
      return target
    }

    if (Array.isArray(source)) {
      for (let key in target) {
        key = +key
        if (!isNaN(key)) {
          const result = immutableAssign(source[key], target[key])
          if (result === source[key] && !force) continue
          ;(ret = ret || [...source])[key] = result
        }
      }
      return ret || source
    }

    if (isPlainObject(source)) {
      for (let key in target) {
        const result = immutableAssign(source[key], target[key])
        if (result === source[key] && !force) continue
        ;(ret = ret || { ...source })[key] = result
      }
      return ret || source
    }
  }

  return target
}

export function immutableDelete(target, path) {
  const copy = deepAssign({}, target)
  unset(copy, path)
  return copy
}

export function fillObject(obj, value) {
  const ret = {}
  for (let key in obj) {
    if (isObject(obj[key]) && !Array.isArray(obj[key])) {
      ret[key] = fillObject(obj[key], value)
    } else {
      ret[key] = value
    }
  }
  return ret
}

export function isEmbeddedJs(value) {
  return /.*<.*>.*/.test(value)
}

export function removeEmbeddedJs(value) {
  return value.replace(/\s*[<>]+/g, '')
}
