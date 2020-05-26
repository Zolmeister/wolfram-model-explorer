import test from 'ava'

import {Tuple, modelFromStr, listFromStr} from '../src/primitives.js'

const m7992 = '{{{1, 2}, {2, 3}} -> {{4, 2}, {2, 1}, {1, 4}, {4, 3}}}'

test('Tuple', t => {
	const a1 = Tuple([1, 2, 3])
	const a2 = Tuple([1, 2, 3])

	t.is(a1, a2)
})

test('listFromStr', t => {
	t.deepEqual(listFromStr('{1, 2, 3, 4}'), [1, 2, 3, 4])
})

test('modelFromStr', t => {
	const {matchTuples, replacementTuples} = modelFromStr(m7992)
	t.deepEqual(matchTuples, [Tuple([-1, -2]), Tuple([-2, -3])])
	t.deepEqual(replacementTuples, [Tuple([-4, -2]), Tuple([-2, -1]), Tuple([-1, -4]), Tuple([-4, -3])])
})
