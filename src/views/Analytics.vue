<template>
  <div class="page-analystics">
    <h4 v-show="core.publish" class="page-title">Gamma Analytics</h4>
    <cv-grid class="chart-stats main-content" kind="condensed">
      <cv-row v-show="core.publish" class="top-toolbar">
        <cv-column :sm="12" :md="12" :lg="3">
          <div class="column-inner-wrapper left">
            <cv-dropdown
              label="Choose Analytics View"
              :value="PairContractAddress[core.net.name][viewType]"
              @change="onViewChange($event)"
            >
              <cv-dropdown-item
                v-for="(item, index) in AnalyticPairs"
                :key="`${index}`"
                :value="PairContractAddress[core.net.name][item]"
              >
                <span>Active LP {{ item }}</span>
              </cv-dropdown-item>
            </cv-dropdown>
          </div>
        </cv-column>
        <cv-column :sm="0" :md="12" :lg="9">
          <div class="column-inner-wrapper" />
        </cv-column>
      </cv-row>

      <template v-for="(item, index) in PairAnalyticItems">
        <VisorManagedPairs
          v-if="pair == item.route"
          :key="`${index}`"
          :pair="item.pairName"
        />
      </template>
    </cv-grid>
  </div>
</template>

<script>
import Vue from "vue";
import chartsVue from "@carbon/charts-vue";
import "@carbon/charts/styles-g100.css";
import VisorManagedPairs from "@/components/analytics/VisorManagedPairs";
import { PairAnalyticItems, PairContractAddress } from "@/constants";
import { mapGetters, mapActions } from "vuex";

Vue.use(chartsVue);

export default {
  name: "Chart",
  components: {
    VisorManagedPairs,
  },
  data() {
    return {
      core: this.$parent.$root.core,
      PairAnalyticItems: PairAnalyticItems,
      PairContractAddress: PairContractAddress,
      pair: "",
    };
  },
  computed: {
    ...mapGetters({
      getIsInitializedPresigined: "DataTable/getIsInitializedPresigined",
      getDataTable: "DataTable/getDataTable",
    }),
    viewType() {
      return this.PairAnalyticItems.filter(
        (obj) => obj.route === this.$route.params.pair.toUpperCase()
      )[0].pairName;
    },
    AnalyticPairs() {
      let activePairs = [];
      for (const key in this.core.pairs[this.core.net.name]) {
        if (this.core.pairs[this.core.net.name][key].hasAnalytics)
          activePairs = [...activePairs, key];
      }

      return activePairs;
    },
  },
  watch: {
    $route(to, from) {
      this.pair = this.core.translateWETH(
        this.$route.params.pair.toUpperCase(),
        true
      );
    },
  },

  async mounted() {
    // When presignin initializeV3 is not done.

    if (!this.getIsInitializedPresigined) {
      let dataTable = {};
      Object.assign(dataTable, this.getDataTable);
      this.$set(dataTable, "data", this.core.tableData);
      dataTable.pagination.numberOfItems = dataTable.data.length;

      this.setUpdating(true);
      this.setIsTableLoaded(false);
      await this.core.initializingDashboard(true);
      this.setIsInitializedPresigined(true);
      await this.updateLPRows();

      // Set filteredData & expandedData onto store with current state
      let expandedDataTemp = await this.core.getExpandedData(dataTable);
      this.setDataTable(dataTable);
      this.setExpandedData(expandedDataTemp);
      this.setUpdating(false);
      this.setIsTableLoaded(true);
    }

    // if (
    //   this.$route.query.view &&
    //   this.$route.query.view.toUpperCase() !== this.$route.name
    // ) {
    //   console.log("pushing", this.$route.query.view.toUpperCase());
    //   this.$router.push({ name: this.$route.query.view.toUpperCase() });
    // }

    this.pair = this.core.translateWETH(
      this.$route.params.pair.toUpperCase(),
      true
    );
    if (
      PairContractAddress[this.core.net.name][
        this.core.translateWETH(this.pair)
      ] === undefined
    )
      this.$router.push({ name: "Dashboard" });

    if (
      this.core.pairs[this.core.net.name][
        this.core.translateWETH(this.pair)
      ] === undefined ||
      this.core.pairs[this.core.net.name][this.core.translateWETH(this.pair)]
        .version === "v1"
    ) {
      window.location.href = `https://v1.gamma.xyz/analytics/${this.pair}`;
    }
  },
  methods: {
    ...mapActions({
      setUpdating: "DataTable/setUpdating",
      setIsTableLoaded: "DataTable/setIsTableLoaded",
      setIsInitializedPresigined: "DataTable/setIsInitializedPresigined",
      setDataTable: "DataTable/setDataTable",
      setExpandedData: "DataTable/setExpandedData",
    }),
    onViewChange(view) {
      const routePair = Object.keys(
        PairContractAddress[this.core.net.name]
      ).find((key) => PairContractAddress[this.core.net.name][key] === view);

      const pairParam = this.PairAnalyticItems.filter(
        (obj) => obj.pairName === this.core.translateWETH(routePair)
      )[0].route;

      this.$router.replace({
        name: "Analytics",
        params: { pair: this.core.translateWETH(pairParam, true) },
      });
    },
  },
};
</script>

<style lang="scss">
@import "../assets/css/main-theme.scss";
</style>
