import _ from 'lodash'
import ForceGraph3D from '3d-force-graph'
import ForceGraphVR from '3d-force-graph-vr'

// import {Model, Tuple, evolve} from './set_replace'
import {Model, Tuple, evolve} from './hyperedge_list'
import WolframModels from './wolfram_models'

import './index.css'

// XXX: Because multi-pattern models not supported
const codes = Object.keys(WolframModels).filter(code => {
  try {
    Model(WolframModels[code])
    return true
  } catch {
    return false
  }
})

const ruleToCode = _.invert(WolframModels)
const ruleFromQuery = (rule) =>
  rule.replace(/\s/g, '').replace(/,/g, ', ').replace(/->/g, ' -> ')
const randomRule = () =>
  WolframModels[codes[Math.floor(Math.random() * (codes.length - 1))]]

// TODO: support multi-pattern models like 1695, 4967
let rule = randomRule()
let steps = 5

const createForceGraph = (isVR) =>
  (isVR ? ForceGraphVR : ForceGraph3D)()(document.getElementById(isVR ? 'graph-vr' : 'graph-3d'))
    .backgroundColor('#121212')
    .nodeColor(() => '#81D4FA')
    .linkColor(() => '#E1F5FE')
    .linkDirectionalArrowLength(4)
    .linkDirectionalArrowRelPos(1)
    .linkCurvature('curvature')
    .linkCurveRotation('rotation')

const forceGraph3D = createForceGraph(false)
const forceGraphVR = createForceGraph(true)
let forceGraph = forceGraph3D

const draw = (forceGraph, rule, steps) => {
  const model = Model(rule)
  const initialSet = model.matchTuples.map(tuple => Tuple(tuple.map(() => 1)))
  const set = evolve(model, initialSet, steps)

  const links = set.map((tuple) => {
    const links = []
    let i = tuple.length - 1
    while (i--) {
      links.push({
        source: tuple[i],
        target: tuple[i + 1],
        isHyperedge: tuple.length > 2
      })
    }
    return links
  }).flat()

  const gData = {
    nodes: _.uniq(set.flat()).map((id) => ({id})),
    links: links.map((link, i) => {
      let overlapTotal = 0
      let overlapIndex = 0
      const isSelfLoop = link.source === link.target

      for (const [j, overlapLink] of links.entries()) {
        if (overlapLink === link) continue

        const isSame = link.source === overlapLink.source && link.target === overlapLink.target
        const isInverted = link.source === overlapLink.target && link.target === overlapLink.source
        const isOverlapping = isSame || isInverted

        if (isOverlapping) {
          overlapTotal += 1
          if (i > j) {
            overlapIndex += 1
          }
        }
      }

      const rotationFrameAdjust = (rotation) =>
        rotation * (link.source > link.target ? -1 : 1) +
          (link.source > link.target ? Math.PI : 0)

      return {
        source: link.source,
        target: link.target,
        curvature: isSelfLoop ? 0.3 :
          link.isHyperedge ? 0 :
            overlapTotal > 0 ? 0.2 : 0,
        rotation: rotationFrameAdjust(Math.PI * 2 * (overlapIndex + 1) / (overlapTotal + 1)),
        isHyperedge: link.isHyperedge
      }
    })
  }

  console.log('set', set)
  console.log('gData', gData)

  // TODO: show hyperedges
  forceGraph
    .graphData(gData)

  document.getElementById('code').innerText = ruleToCode[rule]
  document.getElementById('code').style.display = ruleToCode[rule] ? 'block' : 'none'
  document.getElementById('rule').innerText = rule
  document.getElementById('steps').innerText = steps + 1 + ' steps'
}

document.getElementById('code').addEventListener('click', () => {
  draw(forceGraph, rule = randomRule(), steps = 5)
  window.history.pushState('', '', '?rule=' + rule.replace(/\s/g, ''))
})

document.getElementById('steps').addEventListener('click', () => {
  draw(forceGraph, rule, ++steps)
})

document.getElementById('vr').addEventListener('click', () => {
  const isVR = forceGraph !== forceGraphVR // toggle
  forceGraph = isVR ? forceGraphVR : forceGraph3D
  draw(forceGraph, rule, steps)

  if (isVR) {
    document.getElementById('graph-3d').style.display = 'none'
    document.getElementById('graph-vr').style.display = 'block'
    document.getElementById('vr').classList.add('selected')
    document.getElementsByTagName('a-scene')[0].enterVR()
  } else {
    document.getElementById('graph-3d').style.display = 'block'
    document.getElementById('graph-vr').style.display = 'none'
    document.getElementById('vr').classList.remove('selected')
  }
})

const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('rule')) {
  rule = ruleFromQuery(urlParams.get('rule'))
} else {
  window.history.replaceState('', '', '?rule=' + rule.replace(/\s/g, ''))
}

window.onpopstate = () => {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('rule')) {
    rule = ruleFromQuery(urlParams.get('rule'))
    draw(forceGraph, rule, steps)
  }
}

window.addEventListener('resize', _.debounce(() => {
  forceGraph3D.height(window.innerHeight)
  forceGraph3D.width(window.innerWidth)
  forceGraphVR.height(window.innerHeight)
  forceGraphVR.width(window.innerWidth)
}, 100))

draw(forceGraph, rule, steps)
