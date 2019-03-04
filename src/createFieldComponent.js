import { Component, createElement, Children } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { omit, isBoolean } from 'lodash'
import Form from './Form'
import Field from './Field'
import { autobind } from 'core-decorators'
import { parseString, removeEmbeddedJs, isEmbeddedJs } from './helpers/utils'

export default type => {
  return class FieldComponent extends Component {
    static propTypes = {
      id: PropTypes.string,
      className: PropTypes.string,
      type: PropTypes.string,
      value: PropTypes.any,
      onChange: PropTypes.func,
      disabled: PropTypes.bool,
      fixed: PropTypes.bool,
      checked: PropTypes.bool,
      validators: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.func,
          PropTypes.shape({
            validator: PropTypes.func.isRequired,
            message: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
          })
        ])
      ),
      defaultValue: PropTypes.any,
      valueType: PropTypes.string,
      path: PropTypes.string.isRequired,
      debounce: PropTypes.number,
      autoCorrect: PropTypes.bool,
      initialValidate: PropTypes.bool,
      trim: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
      children: PropTypes.node
    }

    static contextTypes = {
      form: PropTypes.instanceOf(Form),
      initialValidate: PropTypes.bool
    }

    constructor(props, context) {
      super(props, context)
      this.init(props, context, true)
    }

    isInput() {
      return type === 'input'
    }

    isCheckbox() {
      return this.isInput() && this.props.type === 'checkbox'
    }

    isRadio() {
      return this.isInput() && this.props.type === 'radio'
    }

    isTextInput() {
      return (
        type === 'textarea' ||
        (type === 'input' &&
          (this.props.type === 'text' || this.props.type === 'password'))
      )
    }

    init(props, context, inConstructor) {
      this.field = context.form.register(
        new Field(
          context.form,
          props.path,
          props.validators,
          type === 'input' ? props.type || 'text' : type,
          {
            trim: this.props.trim,
            onReset: () => {
              this.initValue(this.props)
              this.initValidation(this.props, this.context)
            }
          }
        )
      )
      this.initValue(props, inConstructor)
      this.initValidation(props, context)
    }

    initValue(props, inConstructor) {
      let value
      if (this.isCheckbox() || this.isRadio()) {
        value = props.value
        if (props.checked !== undefined) {
          this.updateCheckboxOrRadioInputValue(props)
        }
      } else if (
        props.value !== undefined ||
        props.defaultValue !== undefined
      ) {
        value = props.value !== undefined ? props.value : props.defaultValue
        if (value !== this.field.getValue()) {
          this.field.update(value)
        }
      } else {
        value = this.field.getValue()
      }

      if (inConstructor) {
        /* eslint-disable react/no-direct-mutation-state */
        this.state = this.state || {}
        this.state.value = value
        /* eslint-enable react/no-direct-mutation-state */
      } else {
        this.setState({ value })
      }
    }

    initValidation(props, context) {
      const initialValidate = isBoolean(props.initialValidate)
        ? props.initialValidate
        : context.initialValidate
      this.field.updateValidation(
        Object.assign((initialValidate && this.field.validate()) || {}, {
          disabled: !!props.disabled,
          fixed: !!props.fixed
        })
      )
    }

    updateValue(newProps) {
      if (this.isCheckbox() || this.isRadio()) {
        if (newProps.value !== this.props.value) {
          this.setState({ value: newProps.value })
        }

        if (
          newProps.checked !== undefined &&
          newProps.checked !== this.props.checked
        ) {
          this.updateCheckboxOrRadioInputValue(newProps)
        }
      } else if (newProps.value !== undefined) {
        if (newProps.value !== this.props.value) {
          this.setState({ value: newProps.value })
          if (newProps.value !== this.field.getValue()) {
            this.field.update(newProps.value)
          }
        }
      } else {
        const value = this.field.getValue()
        if (this.state.value !== value) {
          this.setState({ value })
        }
      }

      if (
        type === 'select' &&
        this.props.children !== newProps.children &&
        newProps.autoCorrect
      ) {
        this.autoCorrectSelectValue(
          newProps.value !== undefined ? newProps.value : this.field.getValue(),
          newProps.children
        )
      }
    }

    updateCheckboxOrRadioInputValue(props) {
      const fieldValue = this.field.getValue()
      const updateArrayValue = () => {
        if (props.checked) {
          if (!~fieldValue.indexOf(props.value)) {
            this.field.update([...fieldValue, props.value])
          }
        } else {
          const index = fieldValue.indexOf(props.value)
          if (~index) {
            const newValue = fieldValue.slice()
            newValue.splice(index, 1)
            this.field.update(newValue)
          }
        }
      }
      const updateBoolValue = () => {
        if (props.checked !== fieldValue) {
          this.field.update(props.checked)
        }
      }

      if (this.isCheckbox()) {
        Array.isArray(fieldValue) ? updateArrayValue() : updateBoolValue()
      }

      if (this.isRadio()) {
        if (props.checked && fieldValue !== props.value)
          this.field.update(props.value)
        if (!props.checked && fieldValue === props.value) this.field.update('')
      }
    }

    autoCorrectSelectValue(value, children) {
      const options = Children.toArray(children)
      if (!options.length) {
        this.field.update('')
      } else {
        let selectedOption
        let enabledOptions = []
        for (let i = 0; i < options.length; i++) {
          if (!selectedOption && options[i].props.value === value) {
            selectedOption = options[i]
          }
          if (!options[i].props.disabled) {
            enabledOptions.push(options[i])
          }
        }
        if (!selectedOption || selectedOption.props.disabled) {
          if (enabledOptions.length) {
            this.field.update(enabledOptions[0].props.value)
          } else {
            this.field.update('')
          }
        }
      }
    }

    @autobind
    onChange(value) {
      const args = Array.prototype.slice.call(arguments)
      const _value = value

      if (value.target) {
        const el = value.target

        if (this.isTextInput()) {
          if (isEmbeddedJs(el.value)) {
            el.value = removeEmbeddedJs(el.value)
            /* eslint-disable no-console */
            console.warn(
              'Embedding html or javascript code, e.g. < />, is not allowed. ' +
                'It will be automatically removed from the input text.'
            )
            /* eslint-enable no-console */
          }
        }

        if (this.isCheckbox()) {
          const currentValue = this.field.getValue()
          if (Array.isArray(currentValue)) {
            value = el.checked
              ? [...currentValue, this.props.value]
              : currentValue.filter(item => item !== this.props.value)
          } else {
            value = el.checked
          }
        } else if (this.isRadio()) {
          value = this.props.value
        } else {
          value = parseString(el.value, this.props.valueType)
          this.setState({ value })
        }
      } else {
        this.setState({ value })
      }

      const update = () => {
        if (
          this.isCheckbox() ||
          this.isRadio() ||
          this.props.value === undefined
        ) {
          this.field.update(value)
        }
        this.props.onChange && this.props.onChange.apply(undefined, args)
      }

      if (this.props.debounce || this.isTextInput()) {
        if (_value.target) _value.persist()
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer)
        }
        this.debounceTimer = setTimeout(update, this.props.debounce || 200)
      } else {
        update()
      }
    }

    componentWillReceiveProps(newProps, newContext) {
      if (newProps.path === this.props.path) {
        this.updateValue(newProps)

        if (newProps.validators !== this.props.validators) {
          this.field.updateValidators(newProps.validators)
          this.field.updateValidation(this.field.validate())
        }

        if (newProps.disabled !== this.props.disabled) {
          this.field.updateValidation({ disabled: !!newProps.disabled })
        }

        if (newProps.fixed !== this.props.fixed) {
          this.field.updateValidation({ fixed: !!newProps.fixed })
        }
      } else {
        this.field.form.unregister(this.field)
        if (!this.field.form.getField(this.field.path)) {
          this.field.updateValidation({ disabled: true })
        }
        this.init(newProps, newContext)
      }
    }

    componentWillUnmount() {
      if (!this.field.form.destroyed) {
        this.field.form.unregister(this.field)
        if (!this.field.form.getField(this.field.path)) {
          this.field.updateValidation({ disabled: true })
        }
        this.field.destroy()
      }
    }

    render() {
      const props = omit(this.props, Object.keys(FieldComponent.propTypes))
      const validation = this.field.getValidation() || {}
      const isValid = validation.valid !== false
      const checkboxProps = {}
      const radioProps = {}

      if (this.isCheckbox()) {
        const fieldValue = this.field.getValue()

        if (Array.isArray(fieldValue)) {
          checkboxProps.checked = fieldValue.indexOf(this.props.value) !== -1
          if (validation.fixed && checkboxProps.checked) {
            checkboxProps.disabled = false
          }
        } else {
          checkboxProps.checked = !!fieldValue
        }
      }

      if (this.isRadio()) {
        const fieldValue = this.field.getValue()
        radioProps.checked = fieldValue === this.props.value
        if (validation.fixed && radioProps.checked) {
          radioProps.disabled = false
        }
      }

      const className = classNames(
        'rks-field',
        typeof type === 'string' ? `rks-field-${type}` : null,
        this.props.className,
        {
          invalid: !isValid
        }
      )

      return createElement(type, {
        id: this.props.id,
        className,
        type: this.props.type,
        value: this.state.value,
        disabled: validation.disabled || validation.fixed,
        onChange: this.onChange,
        children: this.props.children,
        ...props,
        ...checkboxProps,
        ...radioProps
      })
    }
  }
}
