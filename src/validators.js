/* eslint-disable max-len */
import createValidator from './createValidator'

export const required = createValidator(value => !!value)

export const pattern = createValidator(regex => value => regex.test(value))

export const maxLength = createValidator(max => value => !(String(value).length > max))

export const minLength = createValidator(min => value => !(String(value).length < min))

export const equal = createValidator(eq => value => eq === value)

export const exclude = createValidator(excluded => value => excluded !== value)