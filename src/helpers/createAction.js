import { createAction } from 'redux-actions'
import defaultCreateUpdateActionTypes from './createUpdateActionTypes'
export default (
  name,
  payloadCreator,
  metaCreator,
  action,
  createUpdateActionTypes = defaultCreateUpdateActionTypes
) => payload => dispatch => {
  const { UPDATE } = createUpdateActionTypes(name)
  const defaultAction = createAction(UPDATE, payloadCreator, metaCreator)
  if (!action) action = defaultAction
  return dispatch(action(payload, defaultAction))
}