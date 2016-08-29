import test from 'ava'
import {thunk} from '../src/index'

const compare = (args1, args2) => args1[0] === args2[0]

const lazy = thunk(compare)

const render = lazy((state, other) => {
  return {state, other}
})

test('creates a lazy thunk', t => {
  t.is(
    render(1).equals(render(1)),
    true
  )
  t.is(
    render(1).equals(render(2)),
    false
  )
})

test('accepts extra args', t => {
  t.deepEqual(
    render(1)(2),
    {state: 1, other: 2}
  )
})

test('thunk of a thunk', t => {
  const f1 = render(1)
  const f2 = lazy(render(1))()
  t.is(
    f1.fn,
    f2.fn
  )
  t.deepEqual(
    f1.args,
    f2.args
  )
})
