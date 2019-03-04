import { PropTypes, Component, createElement } from 'react'
import { connect } from 'react-redux'
import { omit } from 'object.omit'
import FormStore from './FormStore'
import Form from './Form'
import ref from './ref'

export default ({
  name,
  path,
  rules,
  initiator,
  preUpdateAction,
  submitAction: preSubmitAction,
  updatePayloadFilter = formUpdates => formUpdates,
  submitPayloadFilter = form => form,
  dispatchToUpdate,
  dispatchToSubmit,
  ...options
}) => {
  if (!ref._formStore) {
    ref._formStore = new FormStore()
  }

  return WrappedComponent => {
    let connected = false
    path =
      path ||
      `$$form(${name || WrappedComponent.displayName || WrappedComponent.name})`

    class FormComponent extends Component {
      static propTypes = {
        formInstance: PropTypes.func,
        initialValidate: PropTypes.bool
      }

      static defaultProps = {
        initialValidate: true
      }

      static contextTypes = {
        store: PropTypes.object
      }

      static displayName = `Form(${name ||
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'Component'})`

      static childContextTypes = {
        form: PropTypes.instanceOf(Form),
        initialValidate: PropTypes.bool
      }

      constructor(props, context) {
        super(props, context)

        const formStore = ref._formStore
        if (!formStore.store) {
          formStore.store = this.context.store || this.props.store
        }

        if (!formStore.isRegistered(path)) {
          formStore.register(
            path,
            new Form(
              formStore,
              props,
              path,
              rules,
              initiator,
              preUpdateAction,
              preSubmitAction,
              updatePayloadFilter,
              submitPayloadFilter,
              dispatchToUpdate,
              dispatchToSubmit,
              options
            )
          )
        }

        this.form = formStore.getForm(path)

        if (!connected) {
          WrappedComponent = connect(state => ({
            form: this.form.selector(state)
          }))(WrappedComponent)
          connected = true
        }

        this.form.connected++
        this.props.formInstance && this.props.formInstance(this.form)

        if (!this.form.getFormData()) {
          this.form.create()
        }
      }

      getChildContext() {
        return {
          form: this.form,
          initialValidate: this.props.initialValidate
        }
      }

      componentWillReceiveProps(props) {
        this.form.props = props
      }

      componentWillUnmount() {
        this.form.connected--
        if (this.form.connected === 0 && this.form.options.autoDestroy) {
          this.form.formStore.unregister(this.form.path)
          this.form.destroy()
        }
      }

      componentDidMount() {
        this.form._batchUpdate()
      }

      render() {
        const props = omit(this.props, Object.keys(FormComponent.propTypes))
        return createElement(WrappedComponent, {
          update: this.form.update,
          submit: this.form.submit,
          reset: this.form.reset,
          ...props
        })
      }
    }

    return FormComponent
  }
}
