import { isFunction, isObject } from './helpers/utils'
import { autobind } from 'core-decorators'
import { required } from './validators'

export default class Field {
  constructor(form, path, validators, type, options) {
    this.form = form
    this.path = path
    this.type = type
    this.options = options
    this.updateValidators(validators)
    this.form.on('reset', this._resetEventHandler)
    this.form.on('submit', this._submitEventHandler)
  }

  @autobind
  _resetEventHandler() {
    if (this.options.onReset) this.options.onReset.call()
  }

  @autobind
  _submitEventHandler() {
    if (this.options.trim) {
      this.update(
        isFunction(this.options.trim)
          ? this.options.trim(this.getValue())
          : this.getValue().trim()
      ).then(() => this.options.onSubmit && this.options.onSubmit.call())
    } else {
      this.options.onSubmit && this.options.onSubmit.call()
    }
  }

  initValidationQueue() {
    const normalize = validator => {
      if (isFunction(validator)) return { validator }
      if (isObject(validator)) return validator
    }
    this.queue =
      this.validators &&
      this.validators.reduce((arr, v) => (arr.push(normalize(v)), arr), [])
  }

  validate(value) {
    if (!this.queue) return
    value = value === undefined ? this.getValue() : value
    if (this.options.trim) {
      value = isFunction(this.options.trim)
        ? this.options.trim(value)
        : value.trim()
    }
    const queue = this.queue.slice()
    const formData = this.form.getFormData()
    const validate = v => v.validator(value, formData, this.form.props)

    for (let i = 0; i < queue.length; i++) {
      if (
        (queue[i].validator === required || value !== '') &&
        !validate(queue[i])
      ) {
        return {
          valid: false,
          error:
            typeof queue[i].message === 'function'
              ? queue[i].message(value, formData, this.form.props)
              : queue[i].message
        }
      }
    }

    return { valid: true, error: null }
  }

  @autobind
  update(value) {
    const validation = this.validate(value)
    return this.form.update(this.path, { value, validation })
  }

  @autobind
  updateValidation(validation) {
    this.form.update(this.path, { validation })
  }

  updateValidators(validators) {
    this.validators = validators || this.form.getFieldValidators(this.path)
    this.initValidationQueue()
  }

  getValue() {
    return this.form.getFieldValue(this.path)
  }

  getValidation() {
    return this.form.getFieldValidation(this.path)
  }

  isDisabled() {
    return !!this.getValidation().disabled
  }

  destroy() {
    this.form.off('reset', this._resetEventHandler)
    this.form.off('submit', this._submitEventHandler)
  }
}
