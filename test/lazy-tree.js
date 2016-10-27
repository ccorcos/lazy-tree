import test from 'ava'
import { Node, LazyNode, partial, compare } from '../lazy-tree'

// TODO: fix functions to map, etc. over the count and return an object!
// map
// reduce
// filter
// lazily

const strictTree = (
  Node({count: 1}, [
    Node({count: 2}),
    Node({count: 3}, [
      Node({count: 4}),
    ]),
  ])
)

const lazyTree = (
  Node({count: 1}, [
    Node({count: 2}),
    LazyNode(x => (
      Node({count: x + 2}, [
        Node({count: x + 3}),
      ])
    ), 1),
  ])
)

test('strict tree evaluates to itself', t => {
  t.is(strictTree.evaluate().result.equals(strictTree), true)
})

test('lazy tree evaluates to a strict tree', t => {
  t.is(lazyTree.evaluate().result.equals(strictTree), true)
})

const mappedTree = (
  Node({count: 2}, [
    Node({count: 4}),
    Node({count: 6}, [
      Node({count: 8}),
    ]),
  ])
)

test('map over a strict tree', t => {
  t.is(strictTree.map(x => x * 2).evaluate().result.equals(mappedTree), true)
})

test('map over a lazy tree', t => {
  t.is(lazyTree.map(x => x * 2).evaluate().result.equals(mappedTree), true)
})

const reducedTree = (
  Node({count: 10})
)

test('reduce over a strict tree', t => {
  t.is(strictTree.reduce((x, y) => x + y).evaluate().result.equals(reducedTree), true)
})

test('reduce over a lazy tree', t => {
  t.is(lazyTree.reduce((x, y) => x + y).evaluate().result.equals(reducedTree), true)
})

const filteredThreeTree = (
  Node({count: 1}, [
    Node({count: 2}),
  ])
)

test('filter a value over a strict tree', t => {
  t.is(strictTree.filter(x => x.count !== 3).evaluate().result.equals(filteredThreeTree), true)
})

test('filter a value over a lazy tree', t => {
  t.is(lazyTree.filter(x => x.count !== 3).evaluate().result.equals(filteredThreeTree), true)
})

const filteredEvenTree = (
  Node({count: 1}, [
    Node({count: 3}),
  ])
)

test('filter over a strict tree', t => {
  t.is(strictTree.filter(x => x !== 3).evaluate().result.equals(filteredThreeTree), true)
})

test('filter over a lazy tree', t => {
  t.is(lazyTree.filter(x => x !== 3).evaluate().result.equals(filteredThreeTree), true)
})




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
  return node([
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
    7
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
  t.is(calls, 3)
  // render2 is still the same
  reduce(reducer, c1, render3(-1))
  t.is(calls, 4)
})
