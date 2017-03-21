import { isObject } from './helpers/utils'

export default function getValidationErrors(validation = {}) {
  const errors = []
  let valid = true
  Object.keys(validation).forEach(key => {
    if (
      validation[key].hasOwnProperty('valid') &&
      validation[key].hasOwnProperty('error')
    ) {
      if (!validation[key].valid) {
        valid = false
        if (validation[key].error) {
          errors.push(validation[key].error)
        }
      }
    } else if (isObject(validation[key])) {
      const {
        errors: errs,
        valid: _valid
      } = getValidationErrors(validation[key])
      if (valid) valid = _valid
      errors.push(...errs)
    }
  })
  return { errors, valid }
}