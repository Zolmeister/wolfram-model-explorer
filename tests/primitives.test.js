import test from 'ava'

import {Tuple, modelFromRule, listFromStr, ruleFromStr} from '../src/primitives.js'

const m7992 = ruleFromStr('{{{1, 2}, {2, 3}} -> {{4, 2}, {2, 1}, {1, 4}, {4, 3}}}')

test('Tuple', t => {
	const a1 = Tuple([1, 2, 3])
	const a2 = Tuple([1, 2, 3])

	t.is(a1, a2)
})

test('listFromStr', t => {
	t.deepEqual(listFromStr('{1, 2, 3, 4}'), [1, 2, 3, 4])
})

test('modelFromRule', t => {
	const {matchTuples, replacementTuples} = modelFromRule(m7992)
	t.deepEqual(matchTuples, [Tuple([-1, -2]), Tuple([-2, -3])])
	t.deepEqual(replacementTuples, [Tuple([-4, -2]), Tuple([-2, -1]), Tuple([-1, -4]), Tuple([-4, -3])])
})
