import _ from 'lodash'
import stringify from 'fast-json-stable-stringify'

export const Tuple = _.memoize(_.identity, (...args) => stringify(args))

export const Pattern = (matchTuples, closedTuples = []) =>
  ({matchTuples, closedTuples})

export const listFromStr = (str) =>
  JSON.parse(str.replace(/{/g, '[').replace(/}/g, ']'))

export const listToString = (list) =>
  JSON.stringify(list)
    .replace(/\[/g, '{')
    .replace(/\]/g, '}')
    .replace(/\s/g, '')
    .replace(/,/g, ', ')

export const ruleFromStr = (str) =>
  str.replace(/\s/g, '')
    .replace(/,/g, ', ')
    .replace(/->/g, ' -> ')
    .replace(/^{{(?!{)/g, '{{{')
    .replace(/(?<!})}}$/g, '}}}')

//   TODO: sort matchTuples by most-valuable match first
//     e.g. [(-1, -2), (-2, -3), (-2, -2)] -> [(-2, -3), (-1, -2), (-2, -2)]
export const modelFromStr = (str) => {
  const parsed = JSON.parse(str.replace(/{/g, '[').replace(/}/g, ']').replace(/->/g, ','))
    .map(sets =>
      sets.map(tuple =>
        Tuple(tuple.map(n => -n)))
    )

  if (parsed.length > 2) {
    throw new Error('Compound models not supported')
  }

  if (/{\d+}/.test(str)) {
    throw new Error('Single element models not supported')
  }

  return {
    matchTuples: parsed[0],
    replacementTuples: parsed[1]
  }
}
