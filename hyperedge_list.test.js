import test from 'ava'

import {Tuple, Pattern, Model, match, replace, matchAll, evolve} from './src/hyperedge_list.js'

const m7992 = '{{{1, 2}, {2, 3}} -> {{4, 2}, {2, 1}, {1, 4}, {4, 3}}}'
const m1194 = '{{{1, 1, 2}} -> {{3, 3, 1}, {2, 1, 1}}}'

test('Tuple', t => {
	const a1 = Tuple([1, 2, 3])
	const a2 = Tuple([1, 2, 3])

	t.is(a1, a2)
})

test('Model', t => {
	const {matchTuples, replacementTuples} = Model(m7992)
	t.deepEqual(matchTuples, [Tuple([-1, -2]), Tuple([-2, -3])])
	t.deepEqual(replacementTuples, [Tuple([-4, -2]), Tuple([-2, -1]), Tuple([-1, -4]), Tuple([-4, -3])])
})

test('match', t => {
	const pattern = Pattern(Model(m7992).matchTuples)
	const aa = Tuple([9, 9])
	const ab = Tuple([9, 8])

	t.is(match([aa], pattern), null)
	t.deepEqual(match([aa, ab], pattern), [aa, ab])
	t.deepEqual(match([aa, aa], pattern), [aa, aa])
})

test('match: triplet', t => {
	const pattern = Pattern(Model(m1194).matchTuples)
	const aaa = Tuple([9, 9, 9])
	const aab = Tuple([9, 9, 8])
	const aba = Tuple([9, 8, 9])
	const abc = Tuple([9, 8, 7])


	t.is(match([abc], pattern), null)
	t.is(match([aba], pattern), null)
	t.deepEqual(match([aaa], pattern), [aaa])
	t.deepEqual(match([aaa, aba], pattern), [aaa])
	t.deepEqual(match([aab, aba], pattern), [aab])
})

test('replace', t => {
	const set = [Tuple([9, 8]), Tuple([9, 8]), Tuple([8, 7])]
	const replaced = replace(
		set,
		[Tuple([9, 8]), Tuple([8, 7])],
		Model(m7992)
	)

	t.deepEqual(replaced, [Tuple([9, 8]), Tuple([10, 8]), Tuple([8, 9]), Tuple([9, 10]), Tuple([10, 7])])
})

test('matchAll', t => {
	const pattern = Pattern(Model(m7992).matchTuples)
	const aa = Tuple([9, 9])
	const ab = Tuple([9, 8])
	const bc = Tuple([8, 7])
	const cb = Tuple([7, 8])
	const de = Tuple([6, 5])
	const ef = Tuple([5, 4])

	t.deepEqual(matchAll([aa, ab, cb], pattern), [[aa, ab]])
	t.deepEqual(matchAll([aa, ab, bc, de, ef], pattern), [[aa, ab], [de, ef]])
})

test('evolve', t => {
	const initialSet = Model(m7992).matchTuples.map(tuple => Tuple(tuple.map(n => -n)))
	t.deepEqual(evolve(Model(m7992), initialSet, 1),
		[Tuple([4, 2]), Tuple([2, 1]), Tuple([1, 4]), Tuple([4, 3])])
	t.deepEqual(evolve(Model(m7992), initialSet, 2),
		[Tuple([1, 4]), Tuple([4, 3]), Tuple([5, 2]), Tuple([2, 4]), Tuple([4, 5]), Tuple([5, 1])])
})
