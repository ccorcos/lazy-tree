# Lazy Tree

## TODO

- setup with babel, flow, ava, and xo

## Notes

### Flow
npm install -g flow-bin
npm install --save-dev flow-bin
flow init

### Babel
touch .babelrc
npm install --save-dev babel-core babel-preset-es2015 babel-preset-stage-0 babel-plugin-transform-flow-strip-types

```json
{
  "plugins": [
    "transform-flow-strip-types"
  ],
  "presets": [
    "es2015",
    "stage-0"
  ]
}
```

### Ava
npm install -g ava
ava --init

### Xo
npm install -g xo
xo --init
