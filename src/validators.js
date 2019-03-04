/* eslint-disable max-len */
import createValidator from './createValidator'

export const required = createValidator(
  value => value !== undefined && value !== null && value !== ''
)

export const pattern = createValidator(regex => value =>
  regex.test(String(value))
)

export const excludePattern = createValidator(regex => value =>
  !regex.test(String(value))
)

export const max = createValidator(max => value => Number(value) <= max)

export const maxInt = createValidator(max => value =>
  /^\d+$/.test(value) && Number(value) <= max
)

export const min = createValidator(min => value => Number(value) >= min)

export const minInt = createValidator(min => value =>
  /^\d+$/.test(value) && Number(value) >= min
)

export const limit = createValidator((min, max) => value =>
  Number(value) >= min && Number(value) <= max
)

export const limitInt = createValidator((min, max) => value =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max
)

export const maxLength = createValidator(max => value =>
  String(value).length <= max
)

export const minLength = createValidator(min => value =>
  String(value).length >= min
)

export const equal = createValidator(eq => value =>
  Array.isArray(eq) ? eq.some(item => item === value) : eq === value
)

export const unequal = createValidator(uneq => value =>
  Array.isArray(uneq) ? uneq.every(item => item !== value) : uneq !== value
)
