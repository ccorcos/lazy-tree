# Lazy Tree

[![Build Status](https://travis-ci.org/ccorcos/lazy-tree.svg?branch=master)](https://travis-ci.org/ccorcos/lazy-tree)

This package helps you lazily compute values over a tree.

```sh
npm install --save lazy-tree
```

## API

```js
import node, { reduce, thunk } from 'lazy-tree'
```

`node` is just a helper function for creating nodes on a tree. The "value" of a node must be an object, and the children of a node must be an array of nodes. Both "value" and "children" are optional. For example:

```js
const tree = node({count: 1}, [
  node({count: 2}),
  node([
    node({count: 3}),
    node({count: 4}),
  ])
])
```

Next, we might want to `reduce` over that tree to get the total count. You don't need to null-check for nodes without values in your reducer. The second argument is the previous computation (we'll get to that in a second), and the third argument is the tree.

```js
const add = (a,b) => ({count: a.count + b.count})
const computation = reduce(add, undefined, tree)
computation.result
// 10
```

One place where these trees can be useful is in representing some information in a UI component hierarchy. As the UI changes, we can lazily evaluation the next reduction over the tree by reusing the old computation. To do this, first we need to understand thunks.

`thunk` is a nifty little function. First you give it some means of comparing the arguments of a function:

```js
const lazy = thunk((args1, args2) => args1[0] === args2[0])
```

Then you can wrap a pure function that generates a tree:

```js
const render = lazy(count =>
  node({count}, [
    node({count: count * 2}),
    node({count: count * 3}),
  ])
)
```

Now, when you call this function with a value, you are returned a partially applied function that contains information about the original function and the partially applied arguments so you can compare them. For example:

```js
render(1)()
// node({count: 1}, [
//   node({count: 2}),
//   node({count: 3}),
// ])
render(1).equals(render(1))
// true
```

You can also use these lazy nodes in place of nodes as you generate your tree:

```js
render2 = lazy(count =>
  node([
    render(count),
    render(Math.abs(count * 2))
  ])
)
```

Now lets reduce over this lazy tree as we did before:

```js
let calls = 0
const watch = (fn) => (...args) => {
  calls += 1
  return fn(...args)
}
const computation = reduce(watch(add), undefined, render2(1))
computation.result
// 18
calls
// 5
```

We've had to merge values 5 times, two for each `render` subtree and then once more to merge those subtrees. Now, the next time we want to reduce over our the tree, we can pass the previous computation object as the second argument, and we'll lazily reduce the tree, reusing the previous computation where the lazy nodes are equal.

```js
calls = 0
const computation2 = reduce(watch(add), computation, render2(1))
computation2.result
// 18
calls
// 0
```

Because the lazy node is the same as before, we've reused the entire previous computation. Lets look at a more nuanced example:

```js
calls = 0
const computation3 = reduce(watch(add), computation2, render2(-1))
computation3.result
// 6
calls
// 3
```

Now the top-level lazy node has changes, but because of the `Math.abs` in there, one of the subtrees is exactly the same lazy node so we don't have to traverse that whole subtree and were able to reuse the result from the previous computation.
