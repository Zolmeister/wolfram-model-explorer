import _ from 'lodash'
import ForceGraph3D from '3d-force-graph'
import ForceGraphVR from '3d-force-graph-vr'

// import {Model, Tuple, evolve} from './set_replace'
import {Tuple, listFromStr, modelFromStr, listToString, ruleFromStr} from './primitives'
import {evolve} from './hyperedge_list'
import WolframModels from './wolfram_models'

import './index.css'

// TODO: support multi-pattern models like 1695, 4967
// TODO: support single-element models like 225, 833
const codes = Object.keys(WolframModels).filter(code => {
  try {
    modelFromStr(WolframModels[code])
    return true
  } catch {
    return false
  }
})

const randomRule = () =>
  WolframModels[codes[Math.floor(Math.random() * (codes.length - 1))]]

const ruleToCode = _.invert(WolframModels)

// {1, 2, 3} -> {1, 1, 1}
const initialListFromRule = (rule) =>
  modelFromStr(rule).matchTuples.map(tuple => Tuple(tuple.map(() => 1)))

const initialStateFromQuery = (urlParams) =>
  ({
    rule: urlParams.get('rule') ? ruleFromStr(urlParams.get('rule')) : undefined,
    initialList: urlParams.get('init') ? listFromStr(urlParams.get('init')) : undefined,
    steps: urlParams.get('steps') ? parseInt(urlParams.get('steps'), 10) : undefined
  })

const stateToQueryString = ({rule, initialList, steps}) =>
  '?rule=' + rule.replace(/\s/g, '') +
  '&init=' + listToString(initialList ? initialList : initialListFromRule(rule)).replace(/\s/g, '') +
  '&steps=' + steps

const createForceGraph = (constructor, id) =>
  constructor()(document.getElementById(id))
    .backgroundColor('#121212')
    .nodeColor(() => '#81D4FA')
    .linkColor(() => '#E1F5FE')
    .linkDirectionalArrowLength(4)
    .linkDirectionalArrowRelPos(1)
    .linkCurvature('curvature')
    .linkCurveRotation('rotation')

const forceGraph3D = createForceGraph(ForceGraph3D, 'graph-3d')
const forceGraphVR = createForceGraph(ForceGraphVR, 'graph-vr')

// TODO: show hyperedges
const draw = ({rule, initialList, steps, forceGraph}) => {
  initialList = initialList ? initialList : initialListFromRule(rule)
  const set = evolve(modelFromStr(rule), initialList, steps - 1)

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

  forceGraph
    .graphData(gData)

  document.getElementById('code').innerText = ruleToCode[rule]
  document.getElementById('code').style.display = ruleToCode[rule] ? 'block' : 'none'
  document.getElementById('steps').innerText = steps + ' steps'
  document.getElementById('rule').innerText = 'rule ' + rule
  document.getElementById('init').innerText = 'init ' + listToString(initialList)
}

document.getElementById('code').addEventListener('click', () => {
  state = _.defaults({
    rule: randomRule(),
    initialList: null,
    steps: 6
  }, state)
  draw(state)
  window.history.pushState('', '', stateToQueryString(state))
})

document.getElementById('steps').addEventListener('click', () => {
  state = _.defaults({steps: state.steps + 1}, state)
  draw(state)
  window.history.replaceState('', '', stateToQueryString(state))
})

document.getElementById('vr').addEventListener('click', () => {
  const isVR = state.forceGraph !== forceGraphVR // toggle
  state = _.defaults({
    forceGraph: isVR ? forceGraphVR : forceGraph3D
  }, state)
  draw(state)

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

window.onpopstate = () => {
  state = _.defaults(initialStateFromQuery(new URLSearchParams(window.location.search)), state)
  draw(state)
}

window.addEventListener('resize', _.debounce(() => {
  forceGraph3D.height(window.innerHeight)
  forceGraph3D.width(window.innerWidth)
  forceGraphVR.height(window.innerHeight)
  forceGraphVR.width(window.innerWidth)
}, 100))

let state = _.defaults(initialStateFromQuery(new URLSearchParams(window.location.search)), {
  rule: randomRule(),
  steps: 6,
  forceGraph: forceGraph3D
})
window.history.replaceState('', '', stateToQueryString(state))
draw(state)
