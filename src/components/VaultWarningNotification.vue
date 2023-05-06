<template>
  <div
    v-if="visible && !close"
    class="cv-notifiation pending-transactions vault-warning"
  >
    <div class="notification__pending-title">
      <Warning20 class="icon" />
      <h6>Own an NFT vault or V1 position? Access it here</h6>
    </div>
    <div class="notification__pending-content">
      <div class="notification__pending-content__item gamma-link">
        <a href="https://v1.gamma.xyz" target="_blank">
          <Launch16 aria-label="Go to Gamma Strategies v1" />
          <span>Go To v1.gamma.xyz</span>
        </a>
      </div>
    </div>
    <Close20 class="close-icon" @click="onClose" />
  </div>
</template>

<script>
import { Warning20, Launch16, Close20 } from "@carbon/icons-vue/";

export default {
  name: "Notification",
  components: {
    Warning20,
    Launch16,
    Close20,
  },
  props: {
    visible: { type: Boolean },
  },
  data() {
    return {
      close: false,
    };
  },
  mounted() {},
  methods: {
    onClose() {
      this.close = true;
    },
  },
};
</script>
<style lang="scss">
@import "../assets/css/main-theme.scss";
</style>
