import _ from 'lodash'
import stringify from 'fast-json-stable-stringify'

export const Tuple = _.memoize(_.identity, (...args) => stringify(args))

export const Pattern = (matchTuples, closedTuples = [], usedIds = new Set()) =>
  ({
    matchTuples,
    closedTuples,
    usedIds
  })

// TODO: wrap 'set' to hypergraph (?) -> {set, index, maxId}
export const match = (set, pattern) => {
  if (pattern.matchTuples.length === 0) {
    return pattern.closedTuples
  }

  const nextTuple = pattern.matchTuples[0]

  // TODO: extend with filter (with inverted index by id)
  //   if (nextTupleHasRealValue)
  //     filtered = set.filter(nextRealValue)
  for (const setTuple of set.values()) {
    const tempUsedIds = new Set()
    const tempIdMap = {}

    let failed = false
    for (const [i, a] of setTuple.entries()) {
      const b = tempIdMap[nextTuple[i]] || nextTuple[i]

      if (a === b) {
        continue
      } else if (b < 0 && !pattern.usedIds.has(a) && !tempUsedIds.has(a)) {
        tempUsedIds.add(a)
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
        pattern.closedTuples.concat([setTuple]),
        new Set([...pattern.usedIds, ...tempUsedIds])
      )

      const nextMatch = match(set, nextPattern)
      if (nextMatch) {
        return nextMatch
      }
    }
  }

  return null
}

export const matchAll = (set, pattern) => {
  const usedIds = new Set()
  const results = []

  for(;;) {
    const matched = match(set, pattern)
    if (matched) {
      results.push(matched)
      for (const id of _.uniq(matched.flat())) {
        usedIds.add(id)
      }
      // TODO: removed matched from set instead?
      pattern = Pattern(pattern.matchTuples, pattern.closedTuples, usedIds)
    } else {
      break
    }
  }

  return results
}

export const replace = (set, match, model) => {
  // TODO: track nextId in hypergraph
  let nextId = _.max([...set].flat()) + 1
  const replacementMap = Object.fromEntries(_.zip(model.matchTuples.flat(), match.flat()))
  const replacementTuples = model.replacementTuples.map(tuple =>
    tuple.map(x =>
      replacementMap[x] ? replacementMap[x] : replacementMap[x] = nextId++
    )
  )

  const newSet = new Set(set)
  for (const tuple of match) {
    newSet.delete(tuple)
  }
  for (const tuple of replacementTuples) {
    newSet.add(tuple)
  }

  return newSet
}

//   TODO: sort matchTuples by most-valuable match first
//     e.g. [(-1, -2), (-2, -3), (-2, -2)] -> [(-2, -3), (-1, -2), (-2, -2)]
export const Model = (str) => {
  const parsed = JSON.parse(str.replace(/{/g, '[').replace(/}/g, ']').replace(/->/g, ','))
    .map(sets =>
      sets.map(tuple =>
        Tuple(tuple.map(n => -n)))
    )

  return {
    matchTuples: parsed[0],
    replacementTuples: parsed[1]
  }
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
