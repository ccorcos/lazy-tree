
// construct a node object with a convenient syntax:
//
//     node({}, [])
//     node({})
//     node([])
//
export default function node(...args) {
  const [value, children] = parseArgs(args)
  return {
    __type: 'node',
    value,
    children,
  }
}

function parseArgs(args) {
  let [value, children] = args
  if (Array.isArray(value)) {
    children = value
    value = undefined
  }
  return [value, children]
}

// a thunk is basically just a partial application of a function that
// accepts argus, keeps track of the original funciton and the args, and
// has a .equals function for comparing with other thunks
export const thunk = eq => fn => (...args) => {
  const _fn = (...more) => fn.apply(null, args.concat(more))
  _fn.__type = 'thunk'
  if (fn.__type === 'thunk') {
    _fn.fn = fn.fn
    _fn.args = fn.args.concat(args)
  } else {
    _fn.fn = fn
    _fn.args = args
  }
  _fn.equals = (g) => g
                   && g.__type === 'thunk'
                   && _fn.fn === g.fn
                   && g.args
                   && eq(_fn.args, g.args)
  return _fn
}

// this function will lazily construct the result of a reducing all the values
// recursively through a tree. its important that fn returns the same type as
// its input. prev is the previous computation -- the result of the last
// time called to reduce and next is a tree with potentially lazy nodes.
export function reduce(fn, prev, next) {
  // check if there is a previous computation so we can be lazy
  if (next.__type === 'thunk') {
    // if the our tree is lazy
    return reduceThunk(fn, prev, next)
  } else {
    // if next is a node
    return reduceNode(fn, prev, next)
  }
}

function reduceThunk(fn, prev, thunk) {
  if (thunk.equals(prev && prev.thunk)) {
    // if the previous thunk equals this thunk, then the resulting computation
    // is the same
    return prev
  } else {
    // otherwise, evaluate the thunk to get the tree
    const node = thunk()
    // reduce on the node and add this thunk to the computation
    const computation = reduceNode(fn, prev, node)
    return {
      ...computation,
      thunk,
    }
  }
}

function reduceNode(fn, prev, node) {
  if (node.children) {
    // recursively evaluate the node's children
    const children = merge((prev && prev.children) || [], node.children)
      .map(([comp, child]) => reduce(fn, comp, child))
    // gather all of the results
    const result = children
      .map(comp => comp.result)
      .concat([node.value])
      .filter(value => value !== undefined)
      .reduce(fn)
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

// merge will zip together two lists of child nodes. this naive implementation
// is just zip, but we can potentially use more clever algorithms to look for
// insertions and deletions, and also merge based on a reserved key prop just
// like React. note that list1 is a list of computations and list2 is a list
// of nodes.
export function merge(list1, list2) {
  const result = []
  const len = Math.max(list1.length, list2.length)
  let idx = 0
  while (idx < len) {
    result[idx] = [list1[idx], list2[idx]]
    idx += 1
  }
  return result
}
