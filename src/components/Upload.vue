<template>
  <div
    class="cloudwok-embed"
    data-wokid="XnMj">
    <div class="cloudwok-upload-files"/>
    <form class="cloudwok-upload">
      <div class="cloudwok-dropzone"/>
    </form>
  </div>
</template>

<script>
const cloudWokConfig = {
  dropzone: {
    label: 'DRAG N DROP',
    button: 'ADD FILES',
  },
  success: {
    message: {
      title: 'File successfully uploaded!',
      subtitle: '',
      text: 'Your volunteer can find the file now. Let them know it has been successfully uploaded.',
      button: 'OK',
      noButtonOwnCW: true,
      dontpopup: false,
      dontslideup: true,
      dontfadeout: true,
    },
    redirect: '',
  },
};

export default {
  mounted() {
    document.querySelector('.cloudwok-embed').setAttribute('data-config', JSON.stringify(cloudWokConfig));
    (function (window, document) {
      const loader = function () {
        const script = document.createElement('script');


        const tag = document.getElementsByTagName('script')[0];
        script.src = 'https://www.cloudwok.com/cdn-vassets/javascripts/cw.js';
        tag.parentNode.insertBefore(script, tag);
      };
      window.addEventListener ? window.addEventListener('load', loader, false) :
        window.attachEvent('onload', loader);
    }(window, document));
  },
};
</script>

<style scoped>
    .cloudwok-embed .dropzone {
        background: #99ccff !important;
        color: #ffffff !important;
        border: solid 3px #263368 !important;
    }
    .cloudwok-embed .dropzone .filepicker {
        background: #16d2aa !important;
        color: #ffffff !important;
        border: solid 1px #263368 !important;
    }
    .cloudwok-embed .btn-start-upload {
        background: #263368 !important;
        color: #ffffff !important;
        border: solid 1px #263368 !important;
    }
</style>
