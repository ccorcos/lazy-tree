import test from 'ava'
import node from '../src/index'

test('value and children', t => {
  t.deepEqual(
    node({a: 1}, ['b', 'c']),
    {
      __type: 'node',
      value: {a: 1},
      children: ['b', 'c'],
    }
  )
})

test('just value', t => {
  t.deepEqual(
    node({a: 1}),
    {
      __type: 'node',
      value: {a: 1},
      children: undefined,
    }
  )
})

test('just children', t => {
  t.deepEqual(
    node(['b', 'c']),
    {
      __type: 'node',
      value: undefined,
      children: ['b', 'c'],
    }
  )
})
