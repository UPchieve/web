import NetworkService from "./NetworkService";

export default {
  sendVerification(context) {
    return NetworkService.sendVerification(context)
      .then(() => {
        context.msg = "Email sent!";
      })
      .catch(() => {
        context.msg = "Error occurred";
      });
  },
  confirmVerification(context, token) {
    return NetworkService.confirmVerification(context, { token })
      .then(() => {
        context.$router.replace("/");
      })
      .catch(() => {
        context.msg = "Error occurred";
      });
  }
};
