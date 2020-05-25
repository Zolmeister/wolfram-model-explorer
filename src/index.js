import _ from 'lodash'
import ForceGraph3D from '3d-force-graph'
// import ForceGraphVR from '3d-force-graph-vr'

// import {Model, Tuple, evolve} from './set_replace'
import {Model, Tuple, evolve} from './hyperedge_list'
import WolframModels from './wolfram_models'

import './index.css'

const codes = Object.keys(WolframModels)
const randomCode = () => {
  const code = codes[Math.floor(Math.random() * (codes.length - 1))]
  try {
    // Because multi-pattern models not supported
    Model(WolframModels[code])
    return code
  } catch {
    return randomCode()
  }
}

// TODO: open ticket to get zoo on website updated
// TODO: support multi-pattern models like 1695, 4967
// TODO: start at ~~code~~ model from url (or random)
// TODO: support arbitrary model from url (or better, use model instead of code)
let code = randomCode()
let steps = 5

const forceGraph = ForceGraph3D()(document.getElementById('graph'))
  .backgroundColor('#121212')
  .nodeColor(() => '#81D4FA')
  .linkColor(() => '#E1F5FE')
  .linkDirectionalArrowLength(4)
  .linkDirectionalArrowRelPos(1)

const draw = (code, steps) => {
  const model = Model(WolframModels[code])
  const initialSet = model.matchTuples.map(tuple => Tuple(tuple.map(() => 1)))
  const set = evolve(model, initialSet, steps)

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

  // TODO: show self-loops
  // TODO: show duplicate edges
  // TODO: show hyperedges
  // ForceGraphVR()(document.getElementById('graph'))
  forceGraph
    .graphData(gData)

  document.getElementById('code').innerText = code
  document.getElementById('steps').innerText = steps + 1 + ' steps'
}

// TODO: support back button
// TODO: put code in url, for manual editing
document.getElementById('code').addEventListener('click', () => {
  draw(code = randomCode(), steps = 5)
})

document.getElementById('steps').addEventListener('click', () => {
  draw(code, ++steps)
})

draw(code, steps)
