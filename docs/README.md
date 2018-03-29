# Documentation

## Color Palette

### Main

| Color                                   | Variable   | Hex code |
|-----------------------------------------|------------|----------|
| ![color](https://imgur.com/fAQkTOE.png) | --c-accent | #16d2aa  |
| ![color](https://imgur.com/Nlhzx6E.png) | --c-bg     | #f6f6f6  |

### Modals

| Color                                   | Variable          | Hex code |
|-----------------------------------------|-------------------|----------|
| ![color](https://imgur.com/WmpUN2L.png) | --c-shadow        | #1855d1  |
| ![color](https://imgur.com/pP9xu8j.png) | --c-backdrop      | #e3f2fd  |
| ![color](https://imgur.com/yNzw348.png) | --c-shadow-warn   | #f44747  |
| ![color](https://imgur.com/ScoPTpW.png) | --c-backdrop-warn | #feeab2  |

### Labels

| Color                                   | Variable    | Hex code |
|-----------------------------------------|-------------|----------|
| ![color](https://imgur.com/RClSp1z.png) | --c-math    | #f7aef8  |
| ![color](https://imgur.com/ScoPTpW.png) | --c-college | #fed766  |
| ![color](https://imgur.com/Mj7jeip.png) | --c-sat     | #54defd  |


## Style Guide

- [Vue's official guide](https://vuejs.org/v2/style-guide/)
- Use ES6+ syntax
- Two lines of space between `<template>`, `<script>`, and  `<style>`
- No indentation for the first level inside `<template>` / `<script>` /  `<style>`:
```vue
  // Bad
  <template>
    <div class="my-component">
      <div></div>
    </div>
  </template>

  // Good
  <template>
  <div class="my-component">
    <div></div>
  </div>
  </template>
```