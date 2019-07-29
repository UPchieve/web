<template>
  <div class="main-page">
    <div class="form-div">
      <form class="form-debug-sentry">
        <button
          class="btn btn-lg btn-primary debug-btn"
          @click.prevent="debugSentryServer"
        >
          Test Sentry on Server
        </button>
        <button
          class="btn btn-lg btn-primary debug-btn"
          @click.prevent="debugSentryApi"
        >
          Test Sentry on Server API
        </button>
        <button
          class="btn btn-lg btn-primary debug-btn"
          @click.prevent="debugSentryClient"
        >
          Test Sentry on Client
        </button>
        <p class="message">
          {{ msg }}
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import errorFromServer from "@/utils/error-from-server";

export default {
  data() {
    return {
      msg: ""
    };
  },
  methods: {
    debugSentryServer() {
      this.$http.get(process.env.SERVER_ROOT + "/debug-sentry").then(
        () => {
          this.msg = "Server debug did not throw error";
        },
        response => {
          if (response) {
            if (response.status) {
              this.msg = `Server responded with error ${response.status} (${
                response.statusText
              })`;
            } else {
              this.msg = "Network error";
            }
          } else {
            this.msg = "No server response";
          }
        }
      );
    },
    debugSentryApi() {
      NetworkService.debugSentryApi(this).then(
        () => {
          this.msg = "Server API did not throw error";
        },
        response => {
          if (response) {
            if (response.status) {
              this.msg = `Server responded with status code ${response.status}`;
              this.$parent.$emit("async-error", errorFromServer(response));
            } else {
              this.msg = "Network error";
            }
          } else {
            this.msg = "No server response";
          }
        }
      );
    },
    debugSentryClient() {
      if (!process.env.VUE_APP_SENTRY_DSN) {
        this.msg = "No DSN configured";
      } else {
        this.msg = "DSN: " + process.env.VUE_APP_SENTRY_DSN;
      }
      throw new Error("Test of Sentry");
    }
  }
};
</script>

<style lang="scss" scoped>
.main-page {
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.form-debug-sentry {
  display: flex;
  flex-direction: column;
  width: 500px;
  height: 500px;
  margin: auto;
  background-color: white;
  padding: 0px 50px;
  justify-content: space-around;
}

button.debug-btn {
  border-radius: 20px;
  border: 0;
  color: white;
  font-weight: 600;
  background-color: #16d2aa;
}

@media screen and (max-width: 488px) {
  .form-div {
    width: 100%;
  }

  .form-debug-sentry {
    display: flex;
    flex-direction: column;
    margin: 0;
    background-color: white;
    padding: 2rem !important;
    justify-content: space-around;
    width: 100%;
    height: 500px;
  }
}
</style>
