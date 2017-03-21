import { isFunction, isObject, parseString } from './helpers/utils'
import { autobind } from 'core-decorators'

export default class Field {
  constructor(form, path, validators, el) {
    this.form = form
    this.path = path
    this.validators = validators || this.form.getFieldValidators(this.path)
    this.el = el
    this.initValidationQueue()
  }

  setValidators(validators) {
    this.validators = validators
    this.initValidationQueue()
  }

  @autobind
  setElement(el) {
    this.el = el
  }

  initValidationQueue() {
    const normalize = validator => {
      if (isFunction(validator)) return { validator }
      if (isObject(validator)) return validator
    }
    this.queue = this.validators &&
      this.validators.reduce((arr, v) => (arr.push(normalize(v)), arr), [])
  }

  validate(value) {
    if (!this.queue) return
    if (this.el.disabled) return { valid: true, error: null }
    value = value === undefined ? this.getValue() : value
    const queue = this.queue.slice()
    const form = this.form.getFormData()
    const validate = (v) => v.validator(value, form)

    if (this.disabled) {
      return { value, valid: true, error: null }
    }

    for (let i = 0; i < queue.length; i++) {
      if (!validate(queue[i])) {
        return {
          value,
          valid: false,
          error: typeof queue[i].message === 'function' ? 
            queue[i].message(value, form) : queue[i].message
        }
      }
    }
    return { value, valid: true, error: null }
  }

  @autobind
  update(value) {
    if (value === undefined) {
      if (this.isCheckbox()) {
        const currentValue = this.getValue()
        if (Array.isArray(currentValue)) {
          value = this.el.checked
            ? [...currentValue, parseString(this.el.value)]
            : currentValue.filter(item => item !== parseString(this.el.value))
        } else {
          value = this.el.checked
        }
      } else {
        value = parseString(this.el.value)
      }
    }
    const validation = this.validate(value)
    this.form.update(this.path, { value, validation })
  }

  getValue() {
    return this.form.getFieldValue(this.path)
  }

  getValidation() {
    return this.form.getFieldValidation(this.path)
  }

  isInput() {
    return this.el.tagName.toLowerCase() === 'input'
  }

  isCheckbox() {
    return this.isInput() && this.el.type === 'checkbox'
  }

  isRadio() {
    return this.isInput() && this.el.type === 'radio'
  }
}