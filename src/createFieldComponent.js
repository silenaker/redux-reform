import { PropTypes, Component, createElement } from 'react'
import classNames from 'classnames'
import omit from 'object.omit'
import Form from './Form'
import Field from './Field'
import { autobind } from 'core-decorators'
import { parseString } from './helpers/utils'

export default TAG => {
  return class FieldComponent extends Component {
    static propTypes = {
      validators: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.func,
          PropTypes.shape({
            validator: PropTypes.func.isRequired,
            message: PropTypes.oneOfType([
              PropTypes.string,
              PropTypes.func
            ])
          })
        ])
      ),
      value: PropTypes.any,
      path: PropTypes.string.isRequired
    }

    static contextTypes = {
      form: PropTypes.instanceOf(Form)
    }

    constructor(props, context) {
      super(props, context)
      
      this.field = this.context.form.register(this.props.path, new Field(
        this.context.form,
        this.props.path,
        this.props.validators
      ))
    }

    isInput() {
      return TAG === 'input'
    }

    isCheckbox() {
      return this.isInput() && this.props.type === 'checkbox'
    }

    isRadio() {
      return this.isInput() && this.props.type === 'radio'
    }

    @autobind
    onChange() {
      this.field.update()
    }

    componentWillReceiveProps(newProps) {
      if (
        newProps.validators &&
        newProps.validators !== this.props.validators
      ) {
        this.field.setValidators(newProps.validators)
      }

      if (
        newProps.path &&
        newProps.path !== this.props.path
      ) {
        this.field.path = newProps.path
      }
    }

    componentWillUnmount() {
      this.context.form.unregister(this.field.path)
    }

    componentDidUpdate() {
      if (
        this.isInput() &&
        !this.isCheckbox() &&
        !this.isRadio() &&
        this.props.value !== undefined &&
        this.props.value !== this.field.getValue()
      ) {
        this.field.update(this.props.value)
      }
    }

    render() {
      const props = omit(this.props, Object.keys(FieldComponent.propTypes))
      const isValid = this.field.getValidation().valid
      const checkboxProps = {}, radioProps = {}

      if (this.isCheckbox()) {
        const fieldValue = this.field.getValue()
        const inputValue = parseString(this.props.value)

        if (Array.isArray(fieldValue)) {
          checkboxProps.checked = fieldValue.indexOf(inputValue) !== -1
        } else {
          checkboxProps.checked = !!fieldValue
        }
      }

      if (this.isRadio()) {
        const fieldValue = this.field.getValue()
        const inputValue = parseString(this.props.value)
        radioProps.checked = fieldValue === inputValue
      }

      return createElement(TAG, {
        ...props,
        ...checkboxProps,
        ...radioProps,
        ref: this.field.setElement,
        value: this.props.value ? this.props.value : this.field.getValue(),
        className: classNames({
          valid: isValid,
          invalid: !isValid
        }),
        onChange: this.onChange
      })
    }
  }
}