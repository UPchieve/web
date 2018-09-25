# Coding Standards



## Contents

*Note: sections with an empty checkbox haven't been written yet*

1. [Naming Convention](#naming-convention)
1. [Indentation and Line Width](#indentation-and-line-width)
1. JavaScript/Vue
  1.1 [JavaScript](#javascript)
  1.1 [Vue](#vue)
  1.1 [Comments](#comments)
1. [ ] [CSS/SASS](#css-sass)
1. [ ] [HTML](#html)



## Naming Convention

This section deals with the naming conventions for files, not for code elements (you can find those in the language-specific sections). Having said this, these are the guidelines for naming files:
- `kebab-case` for:
  - Documentation documents, unless you want them [to appear on top](https://softwareengineering.stackexchange.com/a/301708)
  - Configuration files
- `CamelCase` for:
  - Components
  - Services
  - Tests
- `snake_case` for:
  - Static assets such as images and icons
- Services must have the `Service` suffix

**[⬆ back to top](#contents)**



## Indentation and Line Width

- *Indent with two spaces:* it makes it easier to read PRs and diffs and it has the plus of being more or less the de-facto standard.
- *Don't go beyond the 80th column unless you have a very good reason:* using the traditional 80 column width allows us to scan the code faster, both because the [saccade](https://en.wikipedia.org/wiki/Saccade) is shorter when moving to the next line, and because it's closer to the [optimal line length](https://baymard.com/blog/line-length-readability) for readability.

**[⬆ back to top](#contents)**



## JavaScript/Vue

### JavaScript

We follow [Airbnb guidelines](https://github.com/airbnb/javascript) and make sure that our code complies with the guide using [ESLint](https://eslint.org/docs/user-guide/getting-started).

Make sure to run the linter before [submitting new PRs](https://github.com/upchieve/web/blob/master/docs/git-workflow.md#pr-convention) either by using a [plugin for your code editor](https://alligator.io/vuejs/vue-eslint-plugin/#editor-configuration) or using the terminal:
```
./node_modules/.bin/eslint --ext .js,.vue path/to/your/directory
```

**[⬆ back to top](#contents)**


### Vue

We follow [Vue official guidelines](https://vuejs.org/v2/style-guide/) and make sure that our code complies with the guide using the [official ESLint plugin](https://github.com/vuejs/eslint-plugin-vue).

Additionally, we use a couple of extra rules for increased readability:
- Two lines of space between `<template>`, `<script>`, and  `<style>`
- No indentation for the first level inside `<template>` / `<script>` /  `<style>`:
  ```vue
  // BAD
  <template>
    <div class="my-component">
      <div></div>
    </div>
  </template>

  // GOOD
  <template>
  <div class="my-component">
    <div></div>
  </div>
  </template>
  ```

**[⬆ back to top](#contents)**


### Comments

We use [JSDoc](http://usejsdoc.org) as a basic reference for comments, however, we don't require you to comment every single function or class since almost all of them are extremely simple in the frontend, and for that reason adding an extra comment if a waste of time.

If you find a very complex code block, chances are that it needs to be refactored. However, if after refactoring the code, there are still important details that need to be documented, then feel free to use the full power of JSDoc.

In addition to the general way of using JSDoc, we also use these conventions:
  - Start every line with space-asterisk-space for greater visual consistency:
    ```javascript
    // BAD
    /**
    A comment line.
    Another comment line.
    Yet another comment line.
    */

    // BAD
    /**
    *A comment line.
    *Another comment line.
    *Yet another comment line.
    */

    // GOOD
    /**
     * A comment line.
     * Another comment line.
     * Yet another comment line.
     */
    ``` 
  - Separate blocks of related comments:
    ```javascript
    // BAD
    /**
     * Does something awesome.
     * @param {type} param1
     * @param {type} param2
     * @param {type} param3
     * @returns {type} Explanation of what it is
     */
    function myComplexFuntionThatRequiresAComment(param1, param2, param3) {
      // ...
      returns someData;
    }

    // GOOD
    /**
     * Does something awesome.
     * 
     * @param {type} param1
     * @param {type} param2
     * @param {type} param3
     * 
     * @returns {type} Explanation of what it is
     */
    function myComplexFuntionThatRequiresAComment(param1, param2, param3) {
      // ...
      returns someData;
    }
    ```
  - Use our `@note` "extension" to avoid polluting the code if you need to write inline comments:
    ```javascript
    // BAD
    function fetchData(endpoint, onFullfill, onRejected) {
      const API = 'https://example.com/api/' // A random inline comment about this constant
      fetch(endpoint)
        .then(onFulfill)
        .catch(onRejected)
    }

    // GOOD
    /**
     * @note {1} A random inline comment about this constant
     */
    function fetchData(endpoint, onFullfill, onRejected) {
      const API = 'https://example.com/api/' // {1}
      fetch(endpoint)
        .then(onFulfill)
        .catch(onRejected)
    }
    ```
  - If you find a refactoring candidate, you can document it using a `@todo` and if you need to reference a specific line, then you can mix it with the `@note` syntax as follows:
  ```javascript
    /**
     * @todo {1} Get rid of this const and substitute endpoint with the full URL
     */
    function fetchData(endpoint, onFullfill, onRejected) {
      const API = 'https://example.com/api/' // {1}
      fetch(endpoint)
        .then(onFulfill)
        .catch(onRejected)
    }
    ```

**[⬆ back to top](#contents)**