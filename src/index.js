import _ from 'lodash'
import ForceGraph3D from '3d-force-graph'

// import {Model, Tuple, evolve} from './set_replace'
import {Model, Tuple, evolve} from './hyperedge_list'

import './index.css'

const m7992 = '{{{1, 2}, {2, 3}} -> {{4, 2}, {2, 1}, {1, 4}, {4, 3}}}'
const m1172 = '{{{1, 2}, {3, 2}} -> {{4, 1}, {4, 2}, {1, 2}, {4, 3}}}'
const m1194 = '{{{1, 1, 2}} -> {{3, 3, 1}, {2, 1, 1}}}'
const m12518 = '{{{1, 2, 3}, {4, 3, 5}, {6, 1}} -> {{7, 5, 4}, {5, 1, 2}, {8, 2, 7}, {3, 2, 9}, {10, 5}, {11, 5}, {12, 4}, {13, 9}}}'

const model = m1194

// const initialSet = new Set([Tuple([1, 2]), Tuple([2, 3])])
const initialSet = Model(model).matchTuples.map(tuple => Tuple(tuple.map(() => 1)))
const set = evolve(Model(model), initialSet, 8)

// TODO: VR support
const gData = {
  nodes: _.uniq(set.flat()).map((id) => ({id})),
  links: set.map((tuple) => {
    const links = []
    let i = tuple.length - 1
    while (i--) {
      links.push({source: tuple[i], target: tuple[i + 1]})
    }
    return links
  }).flat()
}

console.log('set', set)
console.log('gData', gData)
const forceGraph = ForceGraph3D()(document.getElementById('graph'))
forceGraph.graphData(gData)
forceGraph.linkDirectionalArrowLength(6)
forceGraph.linkDirectionalArrowRelPos(1)
