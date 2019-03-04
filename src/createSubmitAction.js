import { isPromise } from './helpers/utils'
import createAsyncAction from './helpers/createAsyncAction'
import createSubmitActionTypes from './createSubmitActionTypes'
import assign from 'object.assign'

export default (selector, payloadCreator, metaCreator, preSubmitAction) =>
  createAsyncAction(
    null,
    selector,
    payloadCreator,
    metaCreator,
    preSubmitAction
      ? (payload, submitAction) => dispatch => {
        const action = dispatch(preSubmitAction(payload)) || {}
        if (isPromise(action)) {
          return action.then(({ error, payload } = {}) =>
              dispatch(assign(submitAction(), { error, payload }))
            )
        } else {
          return dispatch(
              assign(submitAction(), {
                error: action.error,
                payload: action.payload
              })
            )
        }
      }
      : null,
    createSubmitActionTypes
  )
