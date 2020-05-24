import _ from 'lodash'
import ForceGraph3D from '3d-force-graph'

import {Model, evolve} from './set_replace'

import './index.css'

const m1172 = '{{{1, 2}, {2, 3}} -> {{4, 2}, {2, 1}, {1, 4}, {4, 3}}}'
// const m1194 = '{{{1, 1, 2}} -> {{3, 3, 1}, {2, 1, 1}}}'

const set = evolve(Model(m1172), 100)

// TODO: VR support
const gData = {
  nodes: _.uniq([...set.values()].flat()).map((id) => ({id})),
  links: [...set.values()].map((tuple) => {
    const links = []
    let i = tuple.length - 1
    while (i--) {
      links.push({source: tuple[i], target: tuple[i + 1]})
    }
    return links
  }).flat()
}
console.log(gData);

const forceGraph = ForceGraph3D()(document.getElementById('graph'))
forceGraph.graphData(gData)
