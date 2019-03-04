import { isPlainObject } from './helpers/utils'

export const pristine = val => val
export const bool2enum = (str1, str2) => bool => (bool ? str1 : str2)
export const ignore = () => undefined

export default (form, filters) => {
  const { data: formData, validation } = form

  const getPayload = (data, validation, filters) => {
    let payload
    for (var opt in data) {
      if (isPlainObject(data[opt])) {
        const val = getPayload(
          data[opt],
          validation && validation[opt],
          filters && filters[opt]
        )
        if (val) {
          payload = payload || {}
          payload[opt] = val
        }
      } else if (!validation || !validation[opt] || !validation[opt].disabled) {
        const val = ((filters && filters[opt]) || pristine)(data[opt], formData)
        if (val !== undefined) {
          payload = payload || {}
          if (isPlainObject(val)) {
            Object.assign(payload, val)
          } else {
            payload[opt] = val
          }
        }
      }
    }

    return payload
  }

  return getPayload(formData, validation, filters)
}
