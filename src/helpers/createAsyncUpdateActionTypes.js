import { constantCase } from 'change-case'

export default name => {
  name = constantCase(name)
  return {
    UPDATE: `UPDATE_${name}`,
    UPDATE_REQ: `UPDATE_${name}_REQ`,
    UPDATE_TER: `UPDATE_${name}_TER`
  }
}