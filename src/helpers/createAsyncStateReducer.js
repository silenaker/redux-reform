import { handleAction, handleActions } from 'redux-actions'

export default (UPDATE, UPDATE_REQ, UPDATE_TER) => {
  const fetching = handleActions({
    [UPDATE_REQ]: () => true,
    [UPDATE_TER]: () => false
  }, false)
  const fetched = handleActions({
    [UPDATE]: () => true,
    [UPDATE_TER]: () => false
  }, false)
  const fetchSucceed = handleAction(UPDATE, {
    next: () => true,
    throw: () => false },
    true
  )
  return { fetching, fetched, fetchSucceed }
}