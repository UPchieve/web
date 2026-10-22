<template>
  <div class="page">
    <div class="container">
      <div class="content">
        <h1 class="title">National Tutoring Honor Society</h1>
        <slot />
      </div>
      <div class="footer">
        <img class="image" src="@/assets/nths/create-team.png" aria-hidden />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  font-weight: 500;
  @include breakpoint-below('medium') {
    font-size: 24px;
  }
}

.page {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
}
.container {
  border-radius: 8px;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;

  @include breakpoint-above('medium') {
    max-width: 600px;
  }
}
.content {
  padding: 32px;
  gap: 12px;
  display: flex;
  flex-direction: column;
}
.footer {
  display: flex;
  justify-content: center;
  background-color: $upchieve-green;
  background-color: color-mix(in oklab, $upchieve-green, white 70%);
  padding: 24px;
}
.image {
  max-height: 233px;
}
</style>
