# version 1.0.0

# This image is used for building the Android app. It contains:
# - Node (for pnpm and Capacitor)
# - a JDK
# - the Android SDK (for Gradle)
# - glab (for downloading CI secure files, such as the signing keystore)
#
# To get the image into GitLab container registry, do the following:
# - Login to the GitLab registry.
#     $ docker login registry.gitlab.com
# - Build the image.
#     $ docker build -t registry.gitlab.com/upchieve/application/high-line/android-build-image:<version> - < android-build-image.Dockerfile
# - Push the image.
#     $ docker push registry.gitlab.com/upchieve/application/high-line/android-build-image:<version>

FROM node:24.22.1-trixie

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-21-jdk-headless \
  && rm -rf /var/lib/apt/lists/*

RUN GLAB_VERSION=1.128.0 \
  && GLAB_SHA256=b42db1c339cb66df2dbdaf190b8c4e359cb2ea3f7ac53e46302b04777f2cf405 \
  && curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads/glab_${GLAB_VERSION}_linux_amd64.deb" -o /tmp/glab.deb \
  && echo "${GLAB_SHA256}  /tmp/glab.deb" | sha256sum -c - \
  && dpkg -i /tmp/glab.deb \
  && rm /tmp/glab.deb

ENV ANDROID_HOME=/opt/android-sdk

RUN curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/android -o /usr/local/bin/android \
  && chmod +x /usr/local/bin/android \
  && android --no-metrics sdk install "platforms;android-36" "build-tools;35.0.0" platform-tools
