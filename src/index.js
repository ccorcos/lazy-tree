// @flow

type Node<V> = {
  __type: 'node',
  value: V,
  children: Array<Node<V>>,
}

// generate a node of a tree
function node<V>(value: V, children: Array<Node<V>>) : Node<V> {
  return {
    __type: 'node',
    value,
    children,
  }
}

// It would be great if there were meta functions like pulling the args or result type signatures
// from functions so we dont need a fixed arity memoize function.
//
// type Thunk1<A1,B> = (f: (a1:A1) => B, a1: A1) => B
// type Thunk2<A1,A2,B> = (f: (a1:A1, a2: A2) => B, a1: A1, a2: A2) => B
// type Thunk3<A1,A2,A3,B> = (f: (a1:A1, a2: A2, a3: A3) => B, a1: A1, a2: A2, a3: A3) => B
//
// this function returns a partially applied function but keeps track of the
// original function and the arguments so you can compare them
//
// function thunk(fn, ...args) {
//   const _fn = (...more) => fn.apply(null, args.concat(more))
//   _fn.__type = 'thunk'
//   if (fn.__type === 'thunk') {
//     _fn.fn = fn.fn
//     _fn.args = fn.args.concat(args)
//   } else {
//     _fn.fn = fn
//     _fn.args = args
//   }
//   return _fn
// }

type Thunk2<A,B,C> = {
  __type: 'thunk',
  fn: (a: A, b: B) => C,
  args: [a, b],
}

function thunk2<A,B,C>(
  fn: (a: A, b: B) => C,
  a: A,
  b: B,
) : Thunk2<A,B,C> => {
  return {
    __type: 'thunk',
    fn,
    args: [a, b]
  }
}






// this function will lazily construct the result of a tree
// fn merges values, prev is the last computation, and next is a (lazy?) tree
// its important that fn returns the same type as its input.
function reduce(fn, prev, next) {
  if (prev) {
    // check if there is a previous computation so we can be lazy
    if (next.__type === 'thunk') {
      // if the our tree is lazy
      return reduceThunk(fn, prev, next)
    } else {
      // if next is a node
      return reduceNode(fn, prev, next)
    }
  } else {
    // if there is no previous computation, compute the whole thing
    const empty = {children: []}
    if (next.__type === 'thunk') {
      // if the our tree is lazy
      return reduceThunk(fn, empty, next)
    } else {
      // if next is a node
      return reduceNode(fn, empty, next)
    }
  }
}
















// Rather than zip, these ought to be some kind of matching
// strategy that looks for insertions and deletions, and keys...
// similar to R.zip except we do not truncate
function zip(list1, list2) {
  const result = []
  const len = Math.max(list1.length, list2.length)
  let idx = 0
  while (idx < len) {
    result[idx] = [list1[idx], list2[idx]]
    idx += 1
  }
  return result
}

function reduceNode(fn, prev, node) {
  if (prev.node === node) {
    // the root of the tree isnt always lazy so lets compare nodes for
    // safe measure
    return prev
  } else {
    // if the nodes arent equal
    if (node.children) {
      // recursively evaluate the node's children
      // TODO: zip is pretty naive. we could get better performance by
      // checking if the list was reordered
      const children = zip(prev.children, node.children)
        .map(([pc, nc]) => reduce(fn, pc, nc))
      // gather all of the results
      const result = children.reduce((acc, child) =>
        fn(acc, child.result),
        node.value
      )
      // return an object describing the computation
      return {
        __type: 'computation',
        node,
        result,
        children,
      }
    } else {
      // if there are no children then the result is the node's value
      return {
        __type: 'computation',
        node,
        result: node.value,
        children: [],
      }
    }
  }
}

function reduceThunk(fn, prev, thunk) {
  if (equals(thunk, prev.thunk)) {
    // if the previous thunk equals this thunk, then the resulting computation
    // is the same
    return prev
  } else {
    // otherwise, evaluate the thunk to get the tree
    const node = thunk()
    // reduce on the node and add this thunk to the computation
    return {
      ...reduceNode(fn, prev, node),
      thunk,
    }
  }
}
