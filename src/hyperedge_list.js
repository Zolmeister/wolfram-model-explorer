import _ from 'lodash'

import {Tuple, Pattern} from './primitives.js'

// TODO: wrap 'set' to hypergraph (?) -> {set, index, maxId}
export const match = (set, pattern) => {
  if (pattern.matchTuples.length === 0) {
    return pattern.closedTuples
  }

  const nextTuple = pattern.matchTuples[0]

  // TODO: extend with filter (with inverted index by id)
  //   if (nextTupleHasRealValue)
  //     filtered = set.filter(nextRealValue)
  for (const setTuple of set) {
    const tempIdMap = {}

    let failed = false
    for (const [i, a] of setTuple.entries()) {
      const b = tempIdMap[nextTuple[i]] || nextTuple[i]

      if (a === b) {
        continue
      } else if (b < 0) {
        tempIdMap[b] = a
        continue
      } else {
        failed = true
        break
      }
    }

    if (!failed) {
      const nextPattern = Pattern(
        pattern.matchTuples.map(tuple =>
          Tuple(tuple.map(x => tempIdMap[x] || x))).slice(1),
        pattern.closedTuples.concat([setTuple])
      )

      const newSet = set.slice()
      newSet.splice(newSet.indexOf(setTuple), 1)
      const nextMatch = match(newSet, nextPattern)
      if (nextMatch) {
        return nextMatch
      }
    }
  }

  return null
}

export const matchAll = (set, pattern) => {
  const results = []

  for(;;) {
    const matched = match(set, pattern)
    if (matched) {
      results.push(matched)
      const newSet = set.slice()
      for (const setTuple of matched) {
        newSet.splice(newSet.indexOf(setTuple), 1)
      }
      set = newSet
    } else {
      break
    }
  }

  return results
}

export const replace = (set, match, model) => {
  // TODO: track nextId in hypergraph
  let nextId = _.max(set.flat()) + 1
  const replacementMap = Object.fromEntries(_.zip(model.matchTuples.flat(), match.flat()))
  const replacementTuples = model.replacementTuples.map(tuple =>
    Tuple(tuple.map(x =>
      replacementMap[x] ? replacementMap[x] : replacementMap[x] = nextId++
    ))
  )

  const newSet = set.slice()

  for (const tuple of match) {
    newSet.splice(newSet.indexOf(tuple), 1)
  }
  for (const tuple of replacementTuples) {
    newSet.push(tuple)
  }

  return newSet
}

export const evolve = (model, initialSet, t) => {
  const pattern = Pattern(model.matchTuples)
  let set = initialSet
  let i = t
  while (i--) {
    const matches = matchAll(set, pattern)
    for (const match of matches) {
      set = replace(
        set,
        match,
        model
      )
    }
  }

  return set
}
