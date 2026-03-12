<script lang="ts" setup></script>

<template>
  <div class="page">
    <div class="container">
      <div class="content">
        <h1 class="title">National Tutoring Honors Society</h1>
        <p>Thanks for applying to be an NTHS President! 🎉</p>

        <p>
          Our team is reviewing your application now — you'll hear back within a
          few days. If approved, we'll send you everything you need to launch
          your chapter.
        </p>

        <strong>While you wait:</strong>
        <ul>
          <li>✅ Keep tutoring — every session makes a difference</li>
          <li>✅ Get certified in a new subject to expand your impact</li>
          <li>✅ Check out our coach resources to sharpen your skills</li>
        </ul>

        <p>
          Questions? Reach out to
          <a href="mailto:nths@upchieve.org">nths@upchieve.org</a>
        </p>
      </div>
      <div class="footer">
        <img class="image" src="@/assets/nths/create-team.png" aria-hidden />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
ul {
  padding-left: 1em;
}
li {
  list-style-type: none;
}
.user-id-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  background-color: lighten($c-information-blue, 50);

  .copy-container {
    display: flex;
    width: 100%;
    padding: 8px 16px 16px 16px;

    .copy-button {
      color: $c-information-blue;
      font-weight: 700;
    }
  }

  .user-id-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    .label-main {
      font-weight: 700;
    }
  }

  input {
    border: none;
    background: none;
    width: 100%;
    color: $c-secondary-grey;
  }
}

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
.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}
.apply-button {
  margin-top: 16px;
}
.learn-more-link {
  color: $c-success-green;
}
.arrow-icon {
  fill: $c-success-green;
  height: 16px;
  width: 16px;
  margin-top: 2px;
  margin-left: 8px;
}
.image {
  max-height: 233px;
}
.header {
  padding: 1em 1em 0 1em;
  display: flex;
  justify-content: space-between;
  width: 100%;
  @include breakpoint-below('large') {
    flex-direction: column;
  }
}
</style>
