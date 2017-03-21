# Get Started

## Create forms reducer
```javascript
import { combineReducers } from 'redux'
import { createFormReducer } from 'ruckus-form'

const forms = createFormReducer('forms')

export default combineReducers({ forms })
```

> *note*: ruckus-form depends `redux-thunk` and `redux-promise` as peer dependencies for async actions, you should apply these middlewares when create store
>
> ```javascript
> import { createStore, applyMiddleware } from 'redux'
> import thunkMiddleware from 'redux-thunk'
> import promiseMiddleware from 'redux-promise'
> import rootReducer from './reducers'
>
> const middleware = [thunkMiddleware, promiseMiddleware]
> const store = createStore(rootReducer, applyMiddleware(...middleware))
> ```

## Create form component

```javascript
import { Component } from 'react'
import { required, Input } from 'ruckus-form'

const HOC = createForm({
  // this form path is relative to the root mounting
  // point of all form states on store, i.e. 'forms' above
  path: 'login',
  initiator: state => ({
    username: '',
    password: ''
  }),
  rules: {
    username: [
      {
        validator: required,
        message: 'User name is not allowed empty!'
      }
    ],
    password: [
      {
        validator: required,
        message: 'Password is not allowed empty!'
      }
    ]
  },
  submitAction: ({ username, password }) => async dispatch => {
    return await dispatch(login({ username, password }))
  },
  autoDestroy: false
})

const LoginForm = ({ form, update, submit }) => (
  <form novalidate>
    <div>
      <label>Username: <Input type="text" path="username"></label>
      <div>{ form.validation.username.error }</div>
    </div>

    <div>
      <label>Password: <Input type="password" path="password"></label>
      <div>{ form.validation.password.error }</div>
    </div>

    <div><input type="submit" onClick={ submit }>Login</div>
  </form>
)

LoginForm.propTypes = {
    form: PropTypes.object,
    update: PropTypes.func,
    submit: PropTypes.func
}

export default HOC(LoginForm)

```

# Validators

each field can be validated, you can assign rule attribute to each field component or organize rules as a option passed to `createForm`, the rule path is same as the field on which it effects on the form

validators are currying functions, you can use `createValidator` helper to create custom validators