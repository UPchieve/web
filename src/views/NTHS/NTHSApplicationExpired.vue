<script lang="ts" setup>
import NTHSPageLayout from '@/components/NTHS/NTHSPageLayout.vue'
</script>

<template>
  <NTHSPageLayout>
    <p>Your approval to start an NTHS chapter has run out.</p>

    <p>
      Still want to lead a chapter at your school? Email us at
      <a href="mailto:nths@upchieve.org" v-ph:nths="'application_expired.email'"
        >nths@upchieve.org</a
      >
      and we'll help you apply again.
    </p>

    <p>
      Know someone with a chapter at your school? Ask them for an invite link to
      join. 💚
    </p>
  </NTHSPageLayout>
</template>
