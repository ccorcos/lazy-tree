import test from 'ava'
import node, {thunk, reduce} from '../src/index'

const compare = (args1, args2) => args1[0] === args2[0]

const lazy = thunk(compare)

const render1 = lazy(x => {
  return node({x})
})

const render2 = lazy(x => {
  return node({x}, [
    node({x: x * 2}),
    node({x: x * 3}),
  ])
})

const render3 = lazy(x => {
  return node({x}, [
    render1(x),
    render2(Math.abs(x)),
  ])
})

let calls = 0
const reducer = (a, b) => {
  calls += 1
  return {
    x: a.x + b.x,
  }
}

test('reduces values appropriately', t => {
  t.is(
    reduce(reducer, undefined, render1(1)).result.x,
    1
  )
  t.is(
    reduce(reducer, undefined, render2(1)).result.x,
    6
  )
  t.is(
    reduce(reducer, undefined, render3(1)).result.x,
    8
  )
})

test('lazily reduces values', t => {
  calls = 0
  const c1 = reduce(reducer, undefined, render2(1))
  t.is(calls, 2)
  // no extra merges
  reduce(reducer, c1, render2(1))
  t.is(calls, 2)
})

test('recursively lazily reduces values', t => {
  calls = 0
  const c1 = reduce(reducer, undefined, render3(1))
  t.is(calls, 4)
  // render2 is still the same
  reduce(reducer, c1, render3(-1))
  t.is(calls, 6)
})
