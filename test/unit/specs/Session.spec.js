import Vue from 'vue'
import Session from 'src/components/Session'

describe('Hello.vue', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(Session)
    })
    expect(vm.$el.querySelector('.hello h1').textContent).to.equal(
      'Welcome to Your Vue.js App'
    )
  })
})
