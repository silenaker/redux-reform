import { createAction } from 'redux-actions'
import { isPromise } from './utils'
import defaultCreateUpdateActionTypes from './createAsyncUpdateActionTypes'

export default (
  name,
  selector,
  payloadCreator,
  metaCreator,
  asyncAction,
  createUpdateActionTypes = defaultCreateUpdateActionTypes
) => payload => (dispatch, getState) => {
  const { UPDATE, UPDATE_REQ, UPDATE_TER } = createUpdateActionTypes(name)
  const asyncActionReq = createAction(UPDATE_REQ, null, metaCreator)
  const _asyncAction = createAction(UPDATE, payloadCreator, metaCreator)
  const asyncActionTer = createAction(UPDATE_TER, null, metaCreator)

  if (!asyncAction) asyncAction = _asyncAction

  if (selector(getState()).fetching) return
  dispatch(asyncActionReq())
  const action = dispatch(asyncAction(payload, _asyncAction))
  if (isPromise(action)) {
    return action.then(action => (dispatch(asyncActionTer()), action))
  } else {
    dispatch(asyncActionTer())
    return Promise.resolve(action)
  }
}
