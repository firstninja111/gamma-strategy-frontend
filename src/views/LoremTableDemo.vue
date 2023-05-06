<template>
  <div class="lorem-table-page main-content" :class="{ loading: isLoading }">
    <template v-if="isLoading">
      <div class="lorem-page-loader">
        <cv-inline-loading
          v-if="!progress.loading"
          :ending-text="loading.endingText"
          :error-text="loading.errorText"
          :loading-text="loading.loadingText"
          :loaded-text="loading.loadedText"
          :state="loading.state"
        />
        <cv-inline-loading
          v-if="progress.loading"
          :ending-text="loading.endingText"
          :error-text="loading.errorText"
          :loading-text="loading.loadingText"
          :loaded-text="loading.loadedText"
          :state="loading.state"
        />
      </div>
    </template>

    <template v-else>
      <div class="lorem-table-page-inner">
        <div class="lorem-protocol-stats">
          <h4>Protocol Stats</h4>
          <cv-grid>
            <cv-row>
              <cv-column :md="2" :sm="2" :lg="3">
                <div class="stat-container">
                  <span class="sub-title">Total Value Locked</span>
                  <span class="title">
                    <template v-if="isGammaStatsLoading">
                      <cv-skeleton-text />
                    </template>
                    {{ gammaStats.uniswapPairTotalValueLocked }}
                  </span>
                </div>
              </cv-column>
              <cv-column :md="2" :sm="2" :lg="3">
                <div class="stat-container">
                  <span class="sub-title">Total Fees Accrued</span>
                  <span class="title">
                    <template v-if="isGammaStatsLoading">
                      <cv-skeleton-text />
                    </template>
                    {{ gammaStats.uniswapFeesGenerated }}
                  </span>
                </div>
              </cv-column>
              <cv-column :md="2" :sm="2" :lg="3">
                <div class="stat-container">
                  <span class="sub-title">Fee-Based APR</span>
                  <span class="title">
                    <template v-if="isGammaStatsLoading">
                      <cv-skeleton-text />
                    </template>
                    {{ gammaStats.uniswapFeesBasedApr }}
                  </span>
                </div>
              </cv-column>
              <cv-column :md="2" :sm="2" :lg="3">
                <div class="stat-container">
                  <span class="sub-title">Protocol Fees APY</span>
                  <span class="title">
                    <template v-if="isGammaStatsLoading">
                      <cv-skeleton-text />
                    </template>
                    <template v-else> {{ gammaStakingApy }}% </template>
                  </span>
                </div>
              </cv-column>
            </cv-row>
          </cv-grid>
        </div>

        <cv-toast-notification
          v-if="errorInfo.visible && !updating"
          kind="info"
          class="error"
          :title="errorInfo.copy"
          :sub-title="errorInfo.description"
          :close-aria-label="errorInfo.closeAriaLabel"
          :low-contrast="false"
          @close="doCloseNotification"
        />
        <cv-toast-notification
          v-if="successInfo.visible"
          kind="success"
          class="success"
          :title="successInfo.copy"
          :sub-title="successInfo.description"
          :close-aria-label="successInfo.closeAriaLabel"
          :low-contrast="false"
          @close="doCloseNotification"
        />
        <Notification
          :type="type"
          :header="header"
          :sub-header="subHeader"
          :visible="visible"
          class="notification-container"
        />
        <cv-data-table
          v-if="dataTable.data.length > 0 && !updating"
          ref="table"
          v-model="rowSelects"
          search-label="Filter"
          search-placeholder="Search for a token symbol"
          search-clear-label="Clear filter"
          :expanding-search="false"
          :row-size="dataTable.rowSize"
          :auto-width="dataTable.autoWidth"
          :sortable="dataTable.sortable"
          :title="dataTable.title"
          :action-bar-aria-label="dataTable.actionBarAriaLabel"
          :batch-cancel-label="dataTable.batchCancelLabel"
          :zebra="dataTable.zebra"
          :overflow-menu="dataTable.overflowMenu"
          :helper-text="dataTable.helperText"
          :data="filteredData"
          :pagination="dataTable.pagination"
          @pagination="actionOnPagination"
          @row-select-change="actionRowSelectChange"
          @sort="onSort"
          @overflow-menu-click="onOverflowMenuClick"
          @search="actionOnFilter"
        >
          <template v-if="dataTable.use_actions" slot="actions">
            <!-- <div
              v-if="!core.states.is_connected && !updating"
              class="gray-button"
              @click="connect()"
            >
              Connect Wallet
              <b-icon-plus />
            </div>  -->
            <cv-data-table-action
              v-if="core.crucibles.length > 1"
            >
              <svg
                id="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
              >
                <polygon
                  points="11.41 26.59 7.83 23 28 23 28 21 7.83 21 11.41 17.41 10 16 4 22 10 28 11.41 26.59"
                />
                <polygon
                  points="28 10 22 4 20.59 5.41 24.17 9 4 9 4 11 24.17 11 20.59 14.59 22 16 28 10"
                />
              </svg>
            </cv-data-table-action>
            <div
              v-if="core.states.is_connected"
              class="active-column temporary-hidden"
            >
              {{ core.version }}
            </div>
            <div
              v-if="core.states.is_connected && core.net.name == 'mainnet'"
              class="active-column"
            >
              <div class="green-circle"/>
              <a
                :href="explorerLink"
                target="_blank"
                class="active-column-visor-link"
              >
                {{
                  abbreviateAddressFunc(
                    core.crucible._address
                      ? core.crucible._address
                      : core.accounts[0]
                  )
                }}
              </a>
            </div>
            <div
              v-if="core.states.is_connected && core.states.is_pending"
              class="regular-button disabled"
            >
              Loading
              <Renew32 />
            </div>
            
            <div
              v-if="core.states.is_connected"
              class="regular-button"
              :class="{ disabled: toggleButton == 'Loading' }"
              :disabled="core.net.name !== 'mainnet'"
              @click="goStake()"
            >
              Stake Gamma
              <Renew32 v-if="toggleButton == 'Loading'" />
              <Growth32 v-if="toggleButton != 'Loading'" />
            </div>
          </template>

          <template slot="headings">
            <cv-data-table-heading
              v-for="(column, columnIndex) in dataTable.columns"
              :key="`${columnIndex}`"
              :sortable="column.sortable"
            >
              <template v-if="column.tip">
                <cv-tooltip
                  class="header-tooltip"
                  direction="top"
                  :tip="column.tip"
                >
                  {{ column.label }}
                </cv-tooltip>
              </template>
              <template v-else>
                {{ column.label }}
              </template>
            </cv-data-table-heading>
          </template>
          <template slot="data">
            <cv-data-table-row
              v-for="(row, rowIndex) in getFilteredData"
              v-show="
                core.net.name == 'mainnet' ||
                (row[0] != 'xGAMMA' && row[0] != 'GAMMA')
              "
              :key="`${rowIndex}`"
              :value="`${rowIndex}`"
            >
              <template v-if="row">
                <cv-data-table-cell>
                  <div @click="selectRow($event, rowIndex, row[0])">
                    <cv-radio-button
                      :checked="
                        selects[rowIndex + dataTable.pagination.start - 1]
                      "
                      :hide-label="true"
                      :value="`value-${rowIndex}`"
                    />
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div @click="selectRow($event, rowIndex, row[0])">
                    <img
                      v-if="
                        Boolean(
                          core.pairs[core.net.name][core.translateWETH(row[0])]
                        )
                      "
                      :src="
                        core.pairs[core.net.name][core.translateWETH(row[0])]
                          .icon
                      "
                    />
                    <img
                      v-if="row[0] === 'xGAMMA'"
                      src="@/assets/svg/xgamma.svg"
                    />
                    {{ formatAludel(row[0]) }}
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div @click="selectRow($event, rowIndex, row[0])">
                    {{ isConnected ? row[1] : "-" }}
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div @click="selectRow($event, rowIndex, row[0])">
                    <cv-tag :label="row[2]" />
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div @click="selectRow($event, rowIndex, row[0])">
                    {{
                      isConnected
                        ? formatAludel(row[0]) == "ETH-ENS"
                          ? "-"
                          : row[3]
                        : "-"
                    }}
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div @click="selectRow($event, rowIndex, row[0])">
                    <template v-if="isGammaStatsLoading && row[0] === 'xGAMMA'">
                      -
                    </template>
                    <template v-else>
                      {{
                        row[0] === "xGAMMA"
                          ? `${gammaStakingApy}%`
                          : row[4] !== "undefined%" &&
                            row[4] != "NaN" &&
                            row[5] != "Babylon Bond"
                          ? row[4]
                          : "-"
                      }}
                    </template>
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div class="status-cell-inner-wrapper">
                    <div
                      v-if="
                        row[5] === 'Active' ||
                        row[5] == 'Whitelist' ||
                        row[5] == 'Open Beta' ||
                        row[5] == 'Fee Migration' ||
                        row[5] == 'Olympus Bond' ||
                        row[5] == 'Babylon Bond'
                      "
                      class="active-column"
                      @click="selectRow($event, rowIndex, row[0])"
                    >
                      <div class="green-circle" />
                      <span>{{
                        row[4] !== "$undefined" && row[4] != "$NaN"
                          ? row[5] == "Olympus Bond" || row[5] == "Babylon Bond"
                            ? "Active"
                            : row[5]
                          : "-"
                      }}</span>
                    </div>
                    <div
                      v-if="row[5] === 'v1 Migration'"
                      class="active-column"
                      @click="selectRow($event, rowIndex, row[0])"
                    >
                      <div class="blue-circle" />
                      <span>{{ row[5] }}</span>
                    </div>
                    <div
                      v-if="row[5] === 'Private Beta'"
                      class="active-column"
                      @click="selectRow($event, rowIndex, row[0])"
                    >
                      <div class="green-circle" />
                      <span>{{ row[5] }}</span>
                    </div>
                    <div
                      v-if="row[5] === 'Inactive'"
                      class="active-column"
                      @click="selectRow($event, rowIndex, row[0])"
                    >
                      <div class="empty-circle" />
                      <span>{{ row[5] }}</span>
                    </div>
                  </div>
                </cv-data-table-cell>
                <cv-data-table-cell>
                  <div
                    class="chart-link"
                    :class="{ disabled: !hasAnalyticView(row[0]) }"
                    @click="analyticsViewClick(row[0])"
                  >
                    <ChartAverage24 />
                  </div>
                </cv-data-table-cell>
                <template slot="expandedContent">
                  <cv-grid v-if="expandedData[row[0]] && row[0] === 'xGAMMA'">
                    <cv-row>
                      <cv-column :sm="2">
                        <cv-grid>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> GAMMA per xGAMMA </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>
                                {{ expandedData[row[0]].visrPervVisr }}
                              </div>
                            </cv-column>
                          </cv-row>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> Total GAMMA Fees </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>
                                <!-- {{ expandedData[row[0]].feeCumulativeFeeUsd }} -->
                                -
                              </div>
                            </cv-column>
                          </cv-row>
                        </cv-grid>
                      </cv-column>
                      <cv-column :sm="2">
                        <cv-grid>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> Total GAMMA Staked </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>
                                {{
                                  isConnected
                                    ? row[1]
                                    : expandedData[row[0]].stakedAmount
                                }}
                              </div>
                            </cv-column>
                          </cv-row>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> Total GAMMA Staked USD </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>
                                {{
                                  isConnected
                                    ? row[3]
                                    : expandedData[row[0]].stakedUsdAmount
                                }}
                              </div>
                            </cv-column>
                          </cv-row>
                        </cv-grid>
                      </cv-column>
                    </cv-row>
                  </cv-grid>
                  <cv-grid v-if="expandedData[row[0]] && row[0] !== 'xGAMMA'">
                    <cv-row>
                      <cv-column :sm="2">
                        <cv-grid>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> TVL USD </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>
                                {{ expandedData[row[0]].tvl }}
                              </div>
                            </cv-column>
                          </cv-row>
                          <!-- <cv-row -->
                          <!--   v-if="row[0] != 'FLOAT-ETH'" -->
                          <!--   class="expand-content-item" -->
                          <!-- > -->
                          <!--   <cv-column :sm="2"> -->
                          <!--     <strong> Progressive Cap </strong> -->
                          <!--   </cv-column> -->
                          <!--   <cv-column :sm="2"> -->
                          <!--     <div>{{ expandedData[row[0]].perc }}%</div> -->
                          <!--   </cv-column> -->
                          <!-- </cv-row> -->
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> Uni v3 Fee Tier </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>{{ expandedData[row[0]].fee }}%</div>
                            </cv-column>
                          </cv-row>

                          <!-- <cv-row v-if="row[0] != 'FLOAT-ETH'" class="expand-content-item" > -->
                          <!--   <cv-column :sm="2"> -->
                          <!--     <strong> -->
                          <!--       Max {{ expandedData[row[0]].label0 }} -->
                          <!--       Deposit -->
                          <!--     </strong> -->
                          <!--   </cv-column> -->
                          <!--   <cv-column :sm="2"> -->
                          <!--     <div> -->
                          <!--       {{ expandedData[row[0]].deposit0Max }} -->
                          <!--     </div> -->
                          <!--   </cv-column> -->
                          <!-- </cv-row> -->
                          <cv-row
                            v-if="row[0] != 'FLOAT-ETH'"
                            class="expand-content-item"
                          >
                            <cv-column :sm="2">
                              <strong> Max Deposit </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>$100,000</div>
                            </cv-column>
                          </cv-row>
                        </cv-grid>
                      </cv-column>
                      <cv-column :sm="2">
                        <cv-grid>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong> Active LP Tokens </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>
                                {{
                                  core.uniswapv3.hypes[
                                    core.translateWETH(row[0])
                                  ]
                                    ? core.uniswapv3.hypes[
                                        core.translateWETH(row[0])
                                      ].shares
                                    : 0
                                }}
                              </div>
                            </cv-column>
                          </cv-row>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong>
                                {{ expandedData[row[0]].label0 }}
                              </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>{{ expandedData[row[0]].balance0 }}%</div>
                            </cv-column>
                          </cv-row>
                          <cv-row class="expand-content-item">
                            <cv-column :sm="2">
                              <strong>
                                {{ expandedData[row[0]].label1 }}
                              </strong>
                            </cv-column>
                            <cv-column :sm="2">
                              <div>{{ expandedData[row[0]].balance1 }}%</div>
                            </cv-column>
                          </cv-row>
                          <!-- The Vault page link -->
                          <cv-row
                            v-show="!core.publish"
                            class="expand-content-item"
                          >
                            <cv-column :sm="2">
                              <a
                                style="text-decoration: underline"
                                @click="valutDetailClick(row[0])"
                              >
                                To Vault Details
                              </a>
                            </cv-column>
                          </cv-row>
                        </cv-grid>
                      </cv-column>
                    </cv-row>
                  </cv-grid>
                </template>
              </template>
            </cv-data-table-row>
          </template>

          <template v-if="dataTable.use_actions && isLogin" slot="actions">
            <div class="active-column">
              <div class="green-circle" />
              {{ abbreviateAddress(core.accounts[0]) }}
            </div>
            <div class="regular-button">
              NFT Vault Minted
              <b-icon-check />
            </div>
          </template>

          <template v-if="dataTable.use_batchActions" slot="batch-actions">
            <template v-if="core.states.is_connected">
              <!-- v-if="activeAludel == 'VISR' || activeAludel == 'ETH-USDT' || activeAludel == 'USDC-ETH' || activeAludel == 'DAI-ETH'" -->
              <cv-button v-if="depositActive" class="normal" @click="save()">
                {{
                  activeAludel == "xGAMMA"
                    ? "Stake GAMMA"
                    : isSpecialPair
                    ? "Get LP tokens"
                    : "Vault Deposit"
                }}
                <!-- {{
                  activeAludel == "xGAMMA"
                    ? "Stake GAMMA"
                    : "Get LP tokens"
                }} -->
                <!-- <RowExpand32 class="bx--btn__icon" /> -->
              </cv-button>
              <!-- v-if="activeAludel != 'VISR' && activeAludel != 'ETH-USDT' && activeAludel != 'USDC-ETH' && activeAludel != 'DAI-ETH'" -->
              <cv-button
                v-if="!depositActive"
                class="normal"
                disabled
                @click="save()"
              >
                {{
                  activeAludel == "xGAMMA"
                    ? "Stake GAMMA"
                    : isSpecialPair
                    ? "Get LP tokens"
                    : "Vault Deposit"
                }}
                <!-- <RowExpand32 class="bx--btn__icon" /> -->
              </cv-button>
              <cv-button
                v-if="depositActive"
                class="normal"
                @click="download()"
              >
                <!-- {{
                  activeAludel == "xGAMMA"
                    ? "Withdraw GAMMA"
                    : isSpecialPair
                    ? "Redeem LP tokens"
                    : "Vault Withdraw"
                }} -->
                {{
                  activeAludel == "xGAMMA"
                    ? "Withdraw GAMMA"
                    : isSpecialPair
                    ? "Redeem LP tokens"
                    : "Vault Withdraw"
                }}
                <!-- <RowCollapse32 class="bx--btn__icon" /> -->
              </cv-button>
              <cv-button
                v-if="!depositActive"
                class="normal"
                disabled
                @click="download()"
              >
                <!-- {{
                  activeAludel == "xGAMMA"
                    ? "Withdraw GAMMA"
                    : isSpecialPair
                    ? "Redeem LP tokens"
                    : "Vault Withdraw"
                }} -->
                {{
                  activeAludel == "xGAMMA"
                    ? "Withdraw GAMMA"
                    : isSpecialPair
                    ? "Redeem LP tokens"
                    : "Vault Withdraw"
                }}
                <!-- <RowCollapse32 class="bx--btn__icon" /> -->
              </cv-button>
            </template>
            <template v-else>
              <cv-button class="normal" @click="onConnectWallet()">
                Connect Wallet
              </cv-button>
            </template>
          </template>

          <template v-slot:items-selected="{}">
            {{ formatAludel(activeAludel) }} is selected
          </template>

          <template slot="range-text">
            {{ dataTable.pagination.start }}-{{
              Math.min(dataTable.pagination.start + dataTable.pagination.pageSize - 1, dataTable.pagination.numberOfItems)
            }}
            of {{ dataTable.pagination.numberOfItems }} pairs
          </template>
        </cv-data-table>

        <cv-data-table-skeleton
          v-if="dataTable.data.length < 1 || updating"
          :columns="dataTable.columns"
          :rows="skeletonRows"
          :title="dataTable.title"
          :helper-text="dataTable.helperText"
        >
          <template v-if="dataTable.use_actions" slot="actions">
            <!-- <div
              v-if="!core.states.is_connected && !updating"
              class="gray-button"
              @click="connect()"
            >
              Connect Wallet
              <b-icon-plus />
            </div> -->

            <div v-if="core.states.is_connected" class="active-column">
              GAMMA
            </div>

            <div v-if="core.states.is_connected" class="active-column">
              <div class="green-circle" />
              <a
                :href="explorerLink"
                target="_blank"
                class="active-column-visor-link"
              >
                {{ abbreviateAddress }}
              </a>
            </div>
            <div
              v-if="core.states.is_connected"
              class="regular-button disabled"
            >
              Loading
              <Renew32 />
            </div>
          </template>
        </cv-data-table-skeleton>
      </div>
    </template>

    <!-- Consider to remove deposit modal -->
    <cv-modal
      ref="modal"
      :size="modal.size"
      :primary-button-disabled="false"
      :visible="false"
      :auto-hide-off="true"
      @primary-click="submit"
      @secondary-click="close"
    >
      <template slot="title">
        <cv-progress
          :initial-step="progress.initialStep"
          :steps="progress.steps"
          :vertical="false"
        />
      </template>
      <template v-if="progress.initialStep === 0" slot="content">
        <h2>Approve {{ formatAludel(activeAludel) }}</h2>
        <p>
          By clicking Submit you approve {{ formatAludel(activeAludel) }} for
          deposit
        </p>
      </template>
      <template v-if="progress.initialStep === 1" slot="content">
        <h2>Depositing {{ formatAludel(activeAludel) }}</h2>
        <p>Choose the amount you wish to deposit in your vault</p>
        <div class="bx--form-item number">
          <cv-text-input
            v-model="modelNumber"
            label="Amount"
            step="1"
            :mobile="false"
            @input="onNumberInput()"
          />
          <cv-button kind="primary" size="" :disabled="false" @click="max()">
            Max
          </cv-button>
          <cv-button kind="primary" size="" class="minus" @click="minus()">
            -
          </cv-button>
          <!-- <div class="v-line" /> -->
          <cv-button kind="primary" size="" class="plus" @click="plus()">
            +
          </cv-button>
        </div>
      </template>
      <template slot="secondary-button"> Cancel </template>
      <template slot="primary-button"> Submit </template>
    </cv-modal>

    <!-- Modal withdrawal for eth-ens -->
    <cv-modal
      :size="modal.size"
      :primary-button-disabled="false"
      :visible="withdrawMessageVisible"
      :auto-hide-off="true"
      @primary-click="withdrawalMessageProceed"
      @secondary-click="depositMessageCancel"
    >
      <template slot="label"> Alert </template>
      <template slot="title"> Active Withdrawal Migration </template>
      <template slot="content">
        <p>
          Limit and base position of this hypervisor have been merged.
          Depositors to ETH-ENS are advised to redeem their vETH-ENS to await
          migration to new ETH-ENS hypervisor
        </p>
      </template>
      <template slot="secondary-button"> Cancel </template>
      <template slot="primary-button"> Proceed </template>
    </cv-modal>

    <!-- Modal to show when active pair is not activated to deposit -->
    <cv-modal
      :size="modal.size"
      :primary-button-disabled="false"
      :visible="depositMessageVisible"
      :auto-hide-off="true"
      @primary-click="depositMessageProceed"
      @secondary-click="depositMessageCancel"
    >
      <template slot="label"> Alert </template>
      <template slot="title"> Deposits Paused </template>
      <template slot="content">
        <p>
          This hypervisor is not currently accepting deposits
          <!-- Visor is migrating to a new dual deposit mechanism which will allow -->
          <!-- much higher deposits in a single transaction. New deposits will be -->
          <!-- suspended until the new deposit flow is completed. Withdraws function -->
          <!-- as normal. -->
        </p>
      </template>
      <template slot="secondary-button"> Cancel </template>
      <template slot="primary-button"> Proceed </template>
    </cv-modal>

    <!-- Legacy version download REMOVED!! -->


    <!-- Modal Stake current activate pair-->
    <cv-modal
      ref="modalStaked"
      :size="modal.size"
      :primary-button-disabled="!(parseFloat(modelStakedNumber) > 0)"
      :visible="false"
      :auto-hide-off="true"
      @primary-click="submitStaked"
      @secondary-click="closeStaked"
    >
      <template slot="title">
        GAMMA Finance Fee Distribution Withdrawal
      </template>
      <template v-if="downloadProgress.initialStep === 0" slot="content">
        <!-- <h2>Unstaking {{activeAludel}}</h2> -->
        <p>
          Choose the number of {{ formatAludel(activeAludel) }} that you want to
          unstake from GAMMA Finance fee distribution contract. Your withdraw
          will be your proportion of GAMMA tokens, not
          {{ formatAludel(activeAludel) }} tokens.
        </p>
        <div class="bx--form-item slider">
          <cv-slider
            v-model="stackedNumberPercentage"
            label="Unstake and claim GAMMA based on (%)"
            min="0"
            max="100"
            step="1"
            step-multiplier="10"
            min-label="0%"
            max-label="Max"
            @change="onStackedPercentageChanged"
          >
          </cv-slider>
          <cv-text-input
            :value="stackedNumberPercentage + '%'"
            class="slider-percentage-input"
          />
          <cv-link class="slider-max-button" @click="onMaxWithdraw">
            Max
          </cv-link>
        </div>
        <div class="slider-amount">
          <div class="amount-row">
            <span v-if="activeAludel == 'GAMMA'" class="amount-label"
              >Amount of {{ formatAludel(activeAludel) }}</span
            >
            <span v-if="activeAludel == 'xGAMMA'" class="amount-label"
              >Amount of {{ formatAludel(activeAludel) }} you are
              unstaking</span
            >
            <span class="amount-value">
              {{ modelStakedNumber }} {{ formatAludel(activeAludel) }}
            </span>
          </div>
        </div>
      </template>
      <template v-if="downloadProgress.initialStep === 1" slot="content">
        <h2>Remove Assets from Vault</h2>
        <p>Remove unstaked assets from vault</p>
        <div class="bx--form-item number" />
      </template>
      <template slot="secondary-button"> Cancel </template>
      <template slot="primary-button"> Unstake and claim GAMMA </template>
    </cv-modal>

    <!-- Modal to show when user is gonna withdraw current pair -->
    <cv-modal
      ref="modalLP"
      :size="modal.size"
      :primary-button-disabled="
        !(parseFloat(modelLPNumber) > 0) && vaultWalletSelected
      "
      :visible="false"
      :auto-hide-off="true"
      @primary-click="submitLP"
      @secondary-click="closeLP"
    >
      <template slot="title">
        {{ formatAludel(activeAludel) }} Hypervisor Withdrawal
      </template>

      <template slot="content">
        <!-- <template v-if="isSpecialPair && !vaultWalletSelected"> -->
        <template v-if="!vaultWalletSelected">
          <div class="bx--form-item dropdown">
            <cv-dropdown
              v-model="withdrawalMode"
              class="withdraw-mode-dropdown"
              :value="withdrawalMode"
              label="Withdraw Mode"
            >
              <cv-dropdown-item value="Wallet"> From Wallet </cv-dropdown-item>
              <cv-dropdown-item
                v-if="!core.isWalletPair(core.translateWETH(this.activeAludel))"
                value="Vault"
              >
                From Vault
              </cv-dropdown-item>
            </cv-dropdown>
          </div>
        </template>
        <template v-else>
          <!-- <h2>Unstaking {{activeAludel}}</h2> -->
          <p>
            Use the slider to choose the percentage of shares that you want to
            withdraw from
            {{ formatAludel(activeAludel) }}
            Hypervisor
          </p>
          <!-- <div class="bx--form-item number">
            <cv-number-input
              v-model="modelLPNumber"
              label="Number"
              :step="1"
              :min="0"
              :mobile="false"
            >
            </cv-number-input>
            <cv-button kind="primary" size="" :disabled="false" @click="lpMax()">
              Max
            </cv-button>
          </div> -->
          <div class="bx--form-item slider">
            <cv-slider
              v-model="lpNumberPercentage"
              label="Withdraw assets based on (%)"
              min="0"
              max="100"
              step="1"
              step-multiplier="10"
              min-label="0%"
              max-label="Max"
              @change="onLPPercentageChanged"
            >
            </cv-slider>
            <cv-text-input
              :value="lpNumberPercentage + '%'"
              class="slider-percentage-input"
            />
            <cv-link class="slider-max-button" @click="onMaxLpNumber">
              Max
            </cv-link>
          </div>
          <div class="slider-amount">
            <div class="amount-row">
              <span class="amount-label"
                >Amount of {{ formatAludel(activeAludel).split("-")[0] }}</span
              >
              <span class="amount-value">
                {{ lpBalance0 }}% {{ formatAludel(activeAludel).split("-")[0] }}
              </span>
            </div>
            <div class="amount-row">
              <span class="amount-label"
                >Amount of {{ formatAludel(activeAludel).split("-")[1] }}</span
              >
              <span class="amount-value">
                {{ lpBalance1 }}% {{ formatAludel(activeAludel).split("-")[1] }}
              </span>
            </div>
          </div>
        </template>
      </template>
      <template slot="secondary-button"> Cancel </template>
      <template slot="primary-button">
        {{ !vaultWalletSelected ? "Next" : "Withdraw" }}
      </template>
    </cv-modal>
    <VaultWarningNotification :visible="vaultWarningMessageVisible" />
  </div>
</template>

<script>
// @ is an alias to /src

import { mapState } from "vuex";
import Notification from "@/components/shared/notification";
import VaultWarningNotification from "@/components/VaultWarningNotification.vue";
import Renew32 from "@carbon/icons-vue/es/renew/32";
import { ChartAverage24, Growth32 } from "@carbon/icons-vue";
import { PairAnalyticItems, SPECIAL_PAIRS } from "@/constants";

import { mapGetters, mapActions } from "vuex";

export default {
  name: "LoremTable",
  components: {
    Notification,
    Renew32,
    Growth32,
    ChartAverage24,
    VaultWarningNotification,
  },
  data() {
    return {
      PairAnalyticItems: PairAnalyticItems,
      core: this.$parent.$root.core,
      hypes: this.$parent.$root.core.uniswapv3.hypes,
      utils: this.$parent.$root.core.web3.utils,
      isLoading: false,
      vaultWalletSelected: true,
      withdrawalMode: "Wallet",
      loading: {
        endingText: "Ending...",
        errorText: "Error.",
        loadingText: "Loading...",
        loadedText: "Complete.",
        state: "loading",
      },
      dataTable: {},
      itemSelected: "",
      skeletonRows: 5,
      rowSelects: [],
      modal: {
        closeAriaLabel: "Close",
        size: "",
      },
      modalLP: {
        visible: false,
      },
      modelProgram: "",
      modelNumber: "1",
      modelDownloadNumber: "1",
      modelStakedNumber: "0",
      stackedNumberPercentage: "0",
      lpNumberPercentage: "0",
      lpBalance0: "0",
      lpBalance1: "0",
      modelLPNumber: "0",
      type: "loading",
      header: "Loading notification",
      subHeader: "Roius abnta mod tempor",
      visible: false,
      progress: {
        initialStep: 0,
        steps: ["Approval", "Deposit"],
        loading: false,
      },
      downloadProgress: {
        initialStep: 0,
        steps: ["First Step", "Second Step"],
        step1: false,
        step2: false,
      },
      selects: [],
      errorInfo: {
        visible: false,
        copy: "",
        description: "",
        closeAriaLabel: "Custom close aria label",
      },
      successInfo: {
        visible: false,
        copy: "",
        description: "",
        closeAriaLabel: "Custom close aria label",
      },
      contains: "text",
      link: "",
      permitSig: false,
      permissionLockSig: false,
      permissionUnlockSig: false,
      deadline: 0,
      nonce: 0,
      activeAludel: "ETH-USDT",
      etherscanVisor: false,
      etherscanVisorLink: "",
      depositMessageVisible: false,
      withdrawMessageVisible: false,
      vaultWarningMessageVisible: true,
      visorSelect: "",
      override: false,
      toggleButton: "Stake GAMMA",
      filterValue: "",
      sortBy: null,
      filteredData: [],
    };
  },
  computed: {
    explorerLink() {
      const address = this.core.crucible._address
        ? this.core.crucible._address
        : this.core.accounts[0];
      return this.core.net.explorer + "/address/" + address;
    },
    depositActive() {
      if (this.activeAludel === "xGAMMA") return true;
      if (
        this.activeAludel.split("-").length < 2 ||
        this.core.pairs[this.core.net.name][
          this.core.translateWETH(this.activeAludel)
        ] === undefined
      )
        return false;

      return this.core.pairs[this.core.net.name][
        this.core.translateWETH(this.activeAludel)
      ].deposits;
    },
    successInfoVisible() {
      return this.successInfo.visible;
    },
    errorInfoVisible() {
      return this.errorInfo.visible;
    },
    ...mapState(["isLogin"]),
    properAddress() {
      let depositAddress = this.core.crucible._address
        ? this.core.crucible._address
        : this.core.accounts[0];

      // if (this.isSpecialPair) {
      depositAddress =
        this.withdrawalMode == "Wallet"
          ? this.core.accounts[0]
          : this.core.crucible._address;
      // }

      return depositAddress;
    },
    abbreviateAddress() {
      if (this.core.accounts.length == 0) return "";
      /* return 'test'; */

      let address = this.core.accounts[0];
      return (
        address.substring(0, 5) +
        "..." +
        address.substring(
          address.length - (address.length - 38),
          address.length
        )
      );
    },
    page() {
      return Math.floor(
        (this.dataTable.pagination.start - 1) /
          this.dataTable.pagination.pageSize
      );
    },
    isSpecialPair() {
      return SPECIAL_PAIRS.includes(this.core.translateWETH(this.activeAludel));
      //return true;
    },

    ...mapGetters({
      getDataTable: "DataTable/getDataTable",
      getFilteredData: "DataTable/getFilteredData",
      expandedData: "DataTable/getExpandedData",
      getLoading: "DataTable/getLoading",
      updating: "DataTable/getUpdating",
      getIsTableLoaded: "DataTable/getIsTableLoaded",
      getToggleButton: "DataTable/getToggleButton",
      multiple_visors: "DataTable/getMultipleVisors",
      gammaStats: "GammaState/getGammaStats",
      gammaStakingApy: "GammaState/getGammaStakingApy",
      isGammaStatsLoading: "GammaState/getIsGammaStatsLoading",
      getEtherscanVisorLink: "DataTable/getEtherscanVisorLink",
      isConnected: "DataTable/getIsConnected",
      getIsInitializedPresigined: "DataTable/getIsInitializedPresigined",
      getNetwork: "Network/getNetwork",
    }),
  },
  // Watch any change from state or vuex
  watch: {
    successInfoVisible() {
      this.errorInfo.visible = this.successInfo.visible
        ? false
        : this.errorInfo.visible;
    },
    errorInfoVisible() {
      this.successInfo.visible = this.errorInfo.visible
        ? false
        : this.successInfo.visible;
    },
    "$store.state.NotificationInfo.errorInfo": {
      immediate: true,
      deep: true,
      handler() {
        Object.assign(
          this.errorInfo,
          this.$store.state.NotificationInfo.errorInfo
        );
      },
    },
    "$store.state.NotificationInfo.successInfo": {
      immediate: true,
      deep: true,
      handler() {
        Object.assign(
          this.successInfo,
          this.$store.state.NotificationInfo.successInfo
        );
      },
    },
    "$store.state.DataTable.etherscanVisorLink": {
      immediate: true,
      deep: true,
      handler() {
        this.etherscanVisorLink =
          this.$store.state.DataTable.etherscanVisorLink;
      },
    },
    "$store.state.DataTable.toggleButton": {
      immediate: true,
      deep: true,
      handler() {
        this.toggleButton = this.$store.state.DataTable.toggleButton;
      },
    },
    "$store.state.DataTable.dataTable": {
      immediate: true,
      deep: true,
      async handler() {
        Object.assign(this.dataTable, this.$store.state.DataTable.dataTable);
        // let amount = await this.core.getUserVaultBalance();
        this.setFilteredData({
          filterValue: this.filterValue,
          sortBy: this.sortBy,
          // amount: amount,
          amount: 0
        });

        let expandedData = await this.core.getExpandedData(this.dataTable);
        this.setExpandedData(expandedData);
      },
    },
    "$store.state.DataTable.filteredData": {
      immediate: true,
      deep: true,
      handler() {
        Object.assign(
          this.filteredData,
          this.$store.state.DataTable.filteredData
        );
      },
    },
    "$store.state.DataTable.loading": {
      immediate: true,
      deep: true,
      handler() {
        let loading = this.$store.state.DataTable.loading;
        Object.assign(this.loading, loading);
        if (loading.progress) this.progress.loading = true;
      },
    },
    "$store.state.Notifications.isLoading": {
      immediate: true,
      deep: true,
      handler() {
        this.isLoading = this.$store.state.DataTable.isLoading;
      },
    },
    "$store.state.DataTable.isInitialLoaded": {
      immediate: true,
      deep: true,
      async handler() {
        if (this.$store.state.DataTable.isInitialLoaded) this.isLoading = false;
        else this.isLoading = true;
      },
    },
  },
  async mounted() {
    
    setTimeout(()=>{
      console.log("5 secs passed.");
      this.vaultWarningMessageVisible = false;
    },5000);

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

    if (!this.updating && this.getIsTableLoaded) {
      await this.refreshCurPair();
    }
  },
  async updated() {
    this.setPaginationWidth();
    // document.getElementsByClassName('bx--toolbar-search-container-expandable')[0].classList.add("bx--toolbar-search-container-active");
  },
  async created() {
    Object.assign(this.dataTable, this.getDataTable);
    window.addEventListener("resize", this.setPaginationWidth);
  },
  destroyed() {
    window.removeEventListener("resize", this.setPaginationWidth);
  },
  methods: {
    ...mapActions({
      setFilteredData: "DataTable/setFilteredData",
      setDataTable: "DataTable/setDataTable",
      setExpandedData: "DataTable/setExpandedData",
      setEtherscanVisorLink: "DataTable/setEtherscanVisorLink",
      setMultipleVisors: "DataTable/setMultipleVisors",
      setUpdating: "DataTable/setUpdating",
      setToggleButton: "DataTable/setToggleButton",
      setIsTableLoaded: "DataTable/setIsTableLoaded",
      setIsInitializedPresigined: "DataTable/setIsInitializedPresigined",
    }),

    // Refresh current page
    async refreshCurPair() {
      let curPair = this.core.currentPair;
      // console.log(
      //   "here the acitve Pair",
      //   this.core.translateWETH(curPair, true)
      // );

      if (this.core.isLP(this.core.translateWETH(curPair, true))) {
        // console.log(
        //   this.core.uniswapv3.hypes[curPair]["totals"].total0,
        //   this.core.uniswapv3.hypes[curPair]["totals"].total1,
        //   this.core.uniswapv3.hypes[curPair].price,
        //   this.core.uniswapv3.hypes[curPair].tvl,
        // )
        this.core.uniswapv3.hypes[curPair]["slot0"] = await this.core.web3Call(
          this.core.uniswapv3.hypes[curPair].pool.methods.slot0
        );
        this.core.uniswapv3.hypes[curPair]["price"] = this.core.tickToPrice(
          this.core.uniswapv3.hypes[curPair].slot0.tick,
          this.core.uniswapv3.hypes[curPair].decimals0,
          this.core.uniswapv3.hypes[curPair].decimals1
        );

        this.core.uniswapv3.hypes[curPair]["totals"] = await this.core.web3Call(
          this.core.uniswapv3.hypes[curPair]["hype"].methods.getTotalAmounts
        );
        this.core.uniswapv3.hypes[curPair].tvl = await this.core.getTVLUSD(
          curPair
        );
        await this.core.updateUserLP(curPair);
        // console.log(this.core.uniswapv3.hypes[curPair]);
      }

      await this.updateRow(this.core.translateWETH(curPair, true));
      await this.updateAPY(this.core.translateWETH(curPair, true));

      // let amount = await this.core.getUserVaultBalance();
      this.setFilteredData({
        filterValue: this.filterValue,
        sortBy: this.sortBy,
        // amount: amount,
        amount: 0
      });

      let expandedData = await this.core.getExpandedData(this.dataTable);
      this.setExpandedData(expandedData);
      this.setUpdating(true);
      this.setUpdating(false);
    },

    // Convert address
    abbreviateAddressFunc(address = null) {
      this.setEtherscanVisorLink(
        this.core.net.explorer + "/" + this.core.crucible._address
          ? this.core.crucible._address
          : this.core.accounts[0]
      );
      if (!address && this.core.accounts.length == 0) return;
      if (!address) address = this.core.accounts[0];

      return (
        address.substring(0, 5) +
        "..." +
        address.substring(
          address.length - (address.length - 38),
          address.length
        )
      );
    },
    onConnectWallet() {
      this.$parent.$children[0].connect();
    },
    formatAludel(name) {
      if (name.includes("VISR")) {
        return name.replace("vVISR", "xGAMMA").replace("VISR", "GAMMA");
      }

      return name.split(" ")[1] ? name.split(" ")[1] : name;
    },

    hasAnalyticView(pair) {
      console.log;
      return (
        pair == "GAMMA" ||
        pair == "xGAMMA" ||
        this.core.pairs[this.core.net.name][this.core.translateWETH(pair)]
          .hasAnalytics
      );
    },
    setPaginationWidth() {
      const paginationDom =
        document.getElementsByClassName("bx--pagination")[0];
      if (paginationDom) {
        paginationDom.style.width =
          document.getElementsByClassName("bx--data-table")[0].offsetWidth +
          "px";
      }
    },
    onSort(sortBy) {
      this.sortBy = sortBy;
    },
    async actionOnFilter(searchQuery) {
      this.filterValue = searchQuery;
      // let amount = await this.core.getUserVaultBalance();
      this.setFilteredData({
        filterValue: this.filterValue,
        sortBy: this.sortBy,
        // amount: amount,
        amount: 0
      });
    },
    actionOnPagination(val) {
      this.dataTable.pagination.pageSize = val.length;
      this.dataTable.pagination.start = val.start;
    },

    async redeemGas() {
      this.clearMessages();
      const gasPrice = await this.core.gasPrice();
      this.core.redeem.methods
        .redeem()
        .send({ from: this.core.accounts[0], gasPrice }, (err, txHash) => {
          this.header = "Redeeming your AMPL gas subsidy ";
          this.subHeader = txHash;
          this.type = "loading";
          this.link = "https://etherscan.io/tx/" + txHash;
          this.contains = "link";
          this.visible = true;

          this.core.pollTx(
            txHash,
            "redeem",
            (block) => {
              this.header = "Success ";
              this.subHeader = "AMPL subsidy redeemed  " + block;
              this.type = "success";
              localStorage.setItem("7674986315390430016243974230", "1434523");
              setTimeout(() => {
                this.visible = false;
              }, 4000);
              this.core.states.redeem = false;
            },
            (err) => {
              this.clearMessages();
              this.errorInfo.copy = err.message;
              this.errorInfo.visible = true;
            }
          );
        })
        .on("error", (err) => {
          this.clearMessages();
          this.errorInfo.copy = err.message;
          this.errorInfo.visible = true;
          setTimeout(() => {
            this.errorInfo.visible = false;
          }, 4000);
          clearInterval(this.core.polls["redeem"]);
        });
    },
    async approve() {
      this.clearMessages();
      this.loading.loadingText = "Approving...";
      const gasPrice = await this.core.gasPrice();
      this.core.tokens[this.activeAludel].methods
        .approve(this.core.transmuter._address, this.core.max)
        .send({ from: this.core.accounts[0], gasPrice }, (err, txHash) => {
          this.core.pollTx(
            txHash,
            "approve",
            () => {
              this.isLoading = false;
              this.progress.loading = false;
              this.progress.initialStep++;
            },
            (err) => {
              this.clearMessages();
              this.errorInfo.copy = err.message;
              this.errorInfo.visible = true;
              this.close();
            }
          );
        })
        .on("error", (err) => {
          this.clearMessages();
          this.errorInfo.copy = err.message;
          this.errorInfo.visible = true;
          this.close();
          setTimeout(() => {
            this.errorInfo.visible = false;
          }, 4000);
          clearInterval(this.core.polls["approve"]);
        });
    },
    async signLock() {
      this.loading.loadingText = "Staking...";
      let unitAmount = await this.getUnitAmount(this.modelNumber);

      const permission = await this.core.signPermissionLock(
        this.core.crucible._address,
        this.core.signer,
        this.core.aludels[this.activeAludel]._address,
        this.core.tokens[this.activeAludel]._address,
        unitAmount
      );
      const gasPrice = await this.core.gasPrice();
      this.core.transmuter.methods
        .stake(
          this.core.aludels[this.activeAludel]._address,
          this.core.crucible._address,
          unitAmount,
          permission
        )
        .send({ from: this.core.accounts[0], gasPrice }, (err, txHash) => {
          this.core.pollTx(
            txHash,
            "lock",
            async (block) => {
              this.isLoading = false;
              this.progress.loading = false;
              this.progress.initialStep++;
              this.successInfo.copy = "Success ";
              this.successInfo.description =
                "Staked to " + this.activeAludel + " Hypervisor in " + block;
              this.successInfo.visible = true;
              this.close();

              await this.updateRow(this.activeAludel);
              setTimeout(() => {
                this.successInfo.visible = false;
              }, 4000);
            },
            () => {
              this.clearMessages();
              this.close();
            }
          );
        })
        .on("error", (err) => {
          this.clearMessages();
          this.errorInfo.copy = err.message;
          this.errorInfo.visible = true;
          this.close();
          setTimeout(() => {
            this.errorInfo.visible = false;
          }, 4000);
          clearInterval(this.core.polls["mint"]);
        });
    },
    async signUnlock() {
      this.loading.loadingText = "Unstaking...";
      let unitAmount = await this.getUnitAmount(this.modelDownloadNumber);

      const permission = await this.core.signPermissionUnlock(
        this.core.crucible._address,
        this.core.signer,
        this.core.aludels[this.activeAludel]._address,
        this.core.tokens[this.activeAludel]._address,
        unitAmount
      );

      const gasPrice = await this.core.gasPrice();
      this.core.aludels[this.activeAludel].methods
        .unstakeAndClaim(this.core.crucible._address, unitAmount, permission)
        .send({ from: this.core.accounts[0], gasPrice }, (err, txHash) => {
          this.core.pollTx(
            txHash,
            "unlock",
            async (block) => {
              this.isLoading = false;
              this.progress.loading = false;
              this.progress.initialStep++;
              this.successInfo.copy = "Success ";
              this.successInfo.description =
                "Unstaked from " +
                this.activeAludel +
                " Hypervisor in " +
                block;
              this.successInfo.visible = true;
              this.downloadProgress.initialStep++;
              this.downloadProgress.step1 = true;
              await this.updateRow(this.activeAludel);
              setTimeout(() => {
                this.successInfo.visible = false;
              }, 4000);
            },
            () => {
              this.clearMessages();
              this.close();
            }
          );
        })
        .on("error", (err) => {
          this.clearMessages();
          this.errorInfo.copy = err.message;
          this.errorInfo.visible = true;
          this.close();
          setTimeout(() => {
            this.errorInfo.visible = false;
          }, 4000);
          clearInterval(this.core.polls["unlock"]);
        });
    },
    async withdrawVVISR() {
      let balUnlocked = await this.getUnitAmount(this.modelStakedNumber);
      if (this.stackedNumberPercentage == 100) {
        balUnlocked = await this.core.tokens["xGAMMA"].methods
          .balanceOf(this.core.crucible._address)
          .call();
      }
      const gasPrice = await this.core.gasPrice();
      await this.core.rewards.methods
        .leave(balUnlocked)
        .send({ from: this.core.accounts[0], gasPrice }, (err, txHash) => {
          this.core.pollTx(
            txHash,
            "withdrawVVISR",
            async (block) => {
              this.isLoading = false;
              this.progress.loading = false;
              this.progress.initialStep++;
              this.successInfo.copy = "Success ";
              let formattedBalance = await this.prettyPrintAmount(
                this.activeAludel,
                balUnlocked
              );
              this.successInfo.description =
                "Retrieved " +
                formattedBalance +
                " " +
                this.activeAludel +
                " in " +
                block;
              this.successInfo.visible = true;
              this.close();
              setTimeout(() => {
                this.successInfo.visible = false;
              }, 4000);
              await this.updateRow(this.activeAludel);
            },
            () => {
              this.clearMessages();
              this.close();
            }
          );
        })
        .on("error", (err) => {
          this.clearMessages();
          this.errorInfo.copy = err.message;
          this.errorInfo.visible = true;
          this.close();
          setTimeout(() => {
            this.errorInfo.visible = false;
          }, 4000);
          clearInterval(this.core.polls["withdrawVVISR"]);
        });
    },
    async withdrawLP() {
      this.core.currentPair = this.core.translateWETH(this.activeAludel, false);
      let depositAddress = this.core.accounts[0];

      const maxLPNumber = await this.core.uniswapv3.hypes[
        this.core.translateWETH(this.activeAludel)
      ].hype.methods
        .balanceOf(this.properAddress)
        .call();
      // console.log(this.withdrawalMode, this.properAddress);

      this.modelLPNumber = (
        maxLPNumber *
        (this.lpNumberPercentage / 100)
      ).toString();

      let units = this.core.BN(this.modelLPNumber.toString());

      if (this.core.BN(units).gte(this.core.BN(maxLPNumber)))
        units = maxLPNumber.toString();
      else
        units = this.core
          .BN(units)
          .div(this.core.BN("1.000001"))
          .toFixed(0)
          .toString();
      this.loading.loadingText = "Withdrawing...";
      const gasPrice = await this.core.gasPrice();

      // if (units.toString() > maxLPNumber.toString())  units = maxLPNumber;
      // console.log(
      //   this.activeAludel,
      //   this.core.translateWETH(this.activeAludel),
      //   maxLPNumber,
      //   units
      // );
      //legacy support
      if (
        this.activeAludel == "FLOAT-ETH" ||
        this.activeAludel == "GAMMA-ETH"
      ) {
        this.core.uniswapv3.hypes[
          this.core.translateWETH(this.activeAludel)
        ].hype.methods
          .withdraw(units, this.core.accounts[0], depositAddress)
          .send(
            { from: this.core.accounts[0], gasPrice },
            async (err, txHash) => {
              this.isLoading = true;
              this.core.pollTx(
                txHash,
                "withdraw",
                async (block) => {
                  this.isLoading = false;
                  this.successInfo.copy = "Success ";
                  this.successInfo.description =
                    "Redeemed " + this.modelLPNumber + " shares in " + block;
                  let previousShare =
                    this.core.uniswapv3.hypes[this.core.currentPair].shares;
                  // console.log(" Deposit : previous share", previousShare);

                  let sec = 0;
                  var web3GetShareInterval = setInterval(async () => {
                    let newShare = await this.core.web3Call(
                      this.core.uniswapv3.hypes[this.core.currentPair]["hype"]
                        .methods.balanceOf,
                      true,
                      [this.core.accounts[0]]
                    );
                    // console.log(previousShare, newShare, sec);
                    if (previousShare != newShare || sec++ > 19) {
                      await this.refreshCurPair();
                      // console.log("here we are for refreshing");
                      this.successInfo.visible = true;
                      this.close();
                      clearInterval(web3GetShareInterval);
                      setTimeout(async () => {
                        this.successInfo.visible = false;
                      }, 4000);
                    }
                  }, 1000);
                },
                () => {}
              );
            }
          )
          .on("error", (err) => {
            this.clearMessages();
            this.errorInfo.copy = err.message;
            this.errorInfo.visible = true;
            this.close();
            setTimeout(() => {
              this.errorInfo.visible = false;
            }, 4000);
            clearInterval(this.core.polls["withdraw"]);
          });
      } else if (this.activeAludel == "ETH-BABL") {
        this.core.uniswapv3.hypes[
          this.core.translateWETH(this.activeAludel)
        ].hype.methods
          .withdraw(units, this.core.accounts[0], depositAddress, 0, 0)
          .send(
            { from: this.core.accounts[0], gasPrice },
            async (err, txHash) => {
              this.isLoading = true;
              this.core.pollTx(
                txHash,
                "withdraw",
                async (block) => {
                  this.isLoading = false;
                  this.successInfo.copy = "Success ";
                  this.successInfo.description =
                    "Redeemed " + this.modelLPNumber + " shares in " + block;
                  let previousShare =
                    this.core.uniswapv3.hypes[this.core.currentPair].shares;
                  // console.log(" Deposit : previous share", previousShare);

                  let sec = 0;
                  var web3GetShareInterval = setInterval(async () => {
                    let newShare = await this.core.web3Call(
                      this.core.uniswapv3.hypes[this.core.currentPair]["hype"]
                        .methods.balanceOf,
                      true,
                      [this.core.accounts[0]]
                    );
                    // console.log(previousShare, newShare, sec);
                    if (previousShare != newShare || sec++ > 19) {
                      await this.refreshCurPair();
                      // console.log("here we are for refreshing");
                      this.successInfo.visible = true;
                      this.close();
                      clearInterval(web3GetShareInterval);
                      setTimeout(async () => {
                        this.successInfo.visible = false;
                      }, 4000);
                    }
                  }, 1000);
                },
                () => {}
              );
            }
          )
          .on("error", (err) => {
            this.clearMessages();
            this.errorInfo.copy = err.message;
            this.errorInfo.visible = true;
            this.close();
            setTimeout(() => {
              this.errorInfo.visible = false;
            }, 4000);
            clearInterval(this.core.polls["withdraw"]);
          });
      } else {
        // console.log(this.activeAludel);
        let minOut = await this.core.minOut(
          this.core.translateWETH(this.activeAludel)
        );
        let userMinOut = await this.core.userMinOut(
          units,
          this.core.translateWETH(this.activeAludel),
          minOut
        );
        this.core.uniswapv3.hypes[
          this.core.translateWETH(this.activeAludel)
        ].hype.methods
          .withdraw(units, this.core.accounts[0], depositAddress, userMinOut)
          .send(
            { from: this.core.accounts[0], gasPrice },
            async (err, txHash) => {
              this.isLoading = true;
              this.core.pollTx(
                txHash,
                "withdraw",
                async (block) => {
                  this.isLoading = false;
                  this.successInfo.copy = "Success ";
                  this.successInfo.description =
                    "Redeemed " + this.modelLPNumber + " shares in " + block;
                  let previousShare =
                    this.core.uniswapv3.hypes[this.core.currentPair].shares;
                  // console.log(" Deposit : previous share", previousShare);

                  let sec = 0;
                  var web3GetShareInterval = setInterval(async () => {
                    let newShare = await this.core.web3Call(
                      this.core.uniswapv3.hypes[this.core.currentPair]["hype"]
                        .methods.balanceOf,
                      true,
                      [this.core.accounts[0]]
                    );
                    // console.log(previousShare, newShare, sec);
                    if (previousShare != newShare || sec++ > 19) {
                      await this.refreshCurPair();
                      // console.log("here we are for refreshing");
                      this.successInfo.visible = true;
                      this.close();
                      clearInterval(web3GetShareInterval);
                      setTimeout(async () => {
                        this.successInfo.visible = false;
                      }, 4000);
                    }
                  }, 1000);
                },
                () => {}
              );
            }
          )
          .on("error", (err) => {
            this.clearMessages();
            this.errorInfo.copy = err.message;
            this.errorInfo.visible = true;
            this.close();
            setTimeout(() => {
              this.errorInfo.visible = false;
            }, 4000);
            clearInterval(this.core.polls["withdraw"]);
          });
      }
    },
    async updateNonLPRows() {
      const arraysOfPromises = this.core.tableData.map(async (row) => {
        if (row && !this.core.isLP(row[0]) && row[0] != "GAMMA") {
          await this.updateRow(row[0]);
          await this.updateAPY(row[0]);
        }
      });
      await Promise.all(arraysOfPromises);
    },
    async updateLPRows() {
      const arraysOfPromises = this.core.uniswapv3.pairs.map(async (pair) => {
        await this.updateRow(this.core.translateWETH(pair, true));
        await this.updateAPY(this.core.translateWETH(pair, true));
      });

      await Promise.all(arraysOfPromises);

      await this.updateRow("GAMMA");
      await this.updateRow("xGAMMA");
      await this.updateAPY("GAMMA");
    },
    async updateRow(aludel) {
      if (!this.core.tokens[aludel]) return;
      let dec = this.core.tokens[aludel]._address
        ? await this.core.tokens[aludel].methods.decimals().call()
        : 18;

      if (aludel == "GAMMA" || aludel == "xGAMMA") {
        //id not lp or visr-eth
        let balLocked = this.core.accounts[0]
          ? await this.core.tokens[aludel].methods
              .balanceOf(this.core.accounts[0])
              .call()
          : 0;

        if (aludel == "GAMMA") {
          if (this.core.BN(balLocked).gt(this.core.BN("1000000000000000000")))
            this.toggleButton = "Migrate GAMMA";
          else this.toggleButton = "Stake GAMMA";
        }
        this.setToggleButton(this.toggleButton);

        let depositString = this.core.amountFormatter(balLocked, dec);
        this.core.updateTable(aludel, "deposit", depositString); //fake decimals

        if (aludel == "xGAMMA") {
          //update current value
          if (balLocked.toString() != "0") {
            // console.log("balLocked ", balLocked.toString());
            // console.log("ratio ", this.core.rewardsRatio.toString());
            let reward = this.core
              .BN(balLocked)
              .times(this.core.BN(this.core.rewardsRatio))
              .toFixed(0);
            // console.log(reward, reward.toString());

            // console.log(rewardFormattedDex, rewardFormattedDex.toString());
            let rewardString = this.core.amountFormatter(reward, dec);
            this.core.updateTable(aludel, "reward", rewardString);
          }
        }

        return "-";
      }
      if (this.core.isLP(aludel)) {
        // only user has connected
        if (this.core.accounts[0])
          await this.core.updateUserLP(this.core.translateWETH(aludel));
        let deposit =
          this.core.uniswapv3.hypes[this.core.translateWETH(aludel)][
            "perc_share"
          ];
        deposit = (deposit ? deposit : "0.00") + "%";
        this.core.updateTable(
          aludel,
          "deposit",
          this.core.accounts[0] ? deposit : "-"
        );

        let reward =
          this.core.uniswapv3.hypes[this.core.translateWETH(aludel)]["value"];
        reward = "$" + (reward ? reward : "0.00");
        this.core.updateTable(
          aludel,
          "reward",
          this.core.accounts[0] ? reward : "-"
        );
        return "-";
      }

      if (!this.core.crucible.methods) return;
      let balLocked = await this.core.crucible.methods
        .getBalanceLocked(this.core.tokens[aludel]._address)
        .call();

      let depositString = this.core.amountFormatter(balLocked, dec);
      this.core.updateTable(aludel, "deposit", depositString);

      let currentReward = await this.core.aludels[aludel].methods
        .getCurrentVaultReward(this.core.crucible._address)
        .call();
      let formattedReward = parseFloat(
        this.core.ethers.utils.formatEther(currentReward, { commify: true })
      ).toFixed(2);
      this.core.updateTable(aludel, "reward", formattedReward);
    },
    async prettyPrintAmount(aludel, amount) {
      let dec = await this.core.tokens[aludel].methods.decimals().call();
      let amountFormatted = this.core
        .BN(amount)
        .div(this.core.BN(10).pow(this.core.BN(dec)));
      return amountFormatted.toString();
    },
    async getUnitAmount(amount) {
      let decimals = await this.core.tokens[this.activeAludel].methods
        .decimals()
        .call();
      let unitAmount = this.core.ethers.utils.parseUnits(amount, decimals);
      return unitAmount;
    },
    goStake() {
      this.$router.push({ name: "Visr" });
    },
    clearMessages() {
      this.errorInfo.copy = "";
      this.errorInfo.description = "";
      this.errorInfo.visible = false;
      this.successInfo.copy = "";
      this.successInfo.description = "";
      this.successInfo.visible = false;
      this.header = "";
      this.subHeader = "";
      this.visible = false;
    },
    addCommas(nStr) {
      nStr += "";
      var x = nStr.split(".");
      var x1 = x[0];
      var x2 = x.length > 1 ? "." + x[1] : "";
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, "$1" + "," + "$2");
      }
      return x1 + x2;
    },
    depositMessageProceed() {
      this.depositMessageVisible = false;
      this.withdrawMessageVisible = false;
    },
    depositMessageCancel() {
      this.depositMessageVisible = false;
      this.withdrawMessageVisible = false;
    },
    withdrawalMessageProceed() {
      this.withdrawMessageVisible = false;
      this.$router.push({ name: "Ens" });
    },
    async save() {
      if (this.activeAludel == "xGAMMA") {
        this.$router.push({ name: "Visr" });
        return;
      }
      let paused = ["ETH-ENS"];
      if (paused.includes(this.activeAludel)) {
        this.depositMessageVisible = true;
        return;
      }
      if (
        !this.core.pairs[this.core.net.name][
          this.core.translateWETH(this.activeAludel)
        ].deposits
      ) {
        this.depositMessageVisible = true;
        return;
      }
      if (this.core.isLP(this.activeAludel)) {
        this.core.currentPair = this.core.translateWETH(
          this.activeAludel,
          false
        );
        this.$router.push({ name: "ActiveLiquidity" });
        return;
      }

      this.progress.initialStep = 0;
      await this.core.initializeAludel(this.activeAludel);
      await this.core.initializeStakingToken(this.activeAludel);

      //decide whether to show approve
      let allowance = await this.core.tokens[this.activeAludel].methods
        .allowance(this.core.accounts[0], this.core.transmuter._address)
        .call();
      if (allowance > this.core.web3.utils.toBN(0)) {
        this.progress.initialStep = 1;
      }
      this.$refs.modal.show();
    },
    async download() {
      // console.log(
      //   this.activeAludel,
      //   this.core.silo.includes(this.core.accounts[0])
      // );

      if (this.activeAludel == "GAMMA") {
        this.$refs.modalStaked.show();
      } else if (this.activeAludel == "xGAMMA") {
        this.$router.push({ name: "Visr" });
        //this.$refs.modalStaked.show();
      } else if (
        this.activeAludel == "ETH-ENS" &&
        !this.core.silo.includes(this.core.accounts[0])
      ) {
        // console.log("not in silo");
        this.withdrawMessageVisible = true;
        //this.$router.push({ name: "Ens" });
      } else if (this.core.isLP(this.activeAludel)) {
        // console.log("isLP -> true");
        this.lpMax();
        this.$refs.modalLP.show();
      }
    },
    onBatchAction3() {},
    onOverflowMenuClick() {},
    actionRowSelectChange() {},
    doCloseNotification() {
      this.successInfo.visible = false;
      this.errorInfo.visible = false;
    },
    onNumberInput() {},
    async max() {
      let userBalance = await this.core.tokens[this.activeAludel].methods
        .balanceOf(this.core.accounts[0])
        .call();
      let formattedBalance = await this.prettyPrintAmount(
        this.activeAludel,
        userBalance
      );

      this.modelNumber = formattedBalance; //this.core.maxStake.toString();
    },
    async downloadMax() {
      let balLocked = await this.core.crucible.methods
        .getBalanceLocked(this.core.tokens[this.activeAludel]._address)
        .call();

      let formattedBalance = await this.prettyPrintAmount(
        this.activeAludel,
        balLocked
      );

      this.modelDownloadNumber = formattedBalance;
    },
    async lpMax() {
      let depositAddress = this.core.crucible._address
        ? this.core.crucible._address
        : this.core.accounts[0];

      // console.log("deposit", depositAddress);

      // if (this.isSpecialPair) {
      //   depositAddress =
      //     this.withdrawalMode == "Wallet"
      //       ? this.core.accounts[0]
      //       : this.core.crucible._address;
      // }
      this.modelLPNumber = await this.core.uniswapv3.hypes[
        this.core.translateWETH(this.activeAludel)
      ].shares;

      // console.log("modelLPNumber", this.modelLPNumber);
    },
    async onStackedPercentageChanged() {
      if (!this.core.states.is_connected) {
        return;
      }
      const balLocked = await this.core.tokens["xGAMMA"].methods
        .balanceOf(this.core.accounts[0])
        .call();
      const stakedAmount = await this.prettyPrintAmount(
        this.activeAludel,
        balLocked
      );

      this.modelStakedNumber = (
        stakedAmount *
        (this.stackedNumberPercentage / 100)
      )
        .toFixed(2)
        .toString();
    },
    onMaxWithdraw() {
      this.stackedNumberPercentage = "100";
    },
    onMaxLpNumber() {
      this.lpNumberPercentage = "100";
    },
    async updateAPY(aludel) {
      this.core.updateTable(aludel, "apy", "-");
    },
    async onLPPercentageChanged() {
      if (!this.core.states.is_connected) {
        return;
      }

      if (this.expandedData[this.activeAludel]) {
        this.lpBalance0 = this.expandedData[this.activeAludel].balance0;
        this.lpBalance1 = this.expandedData[this.activeAludel].balance1;
      }
    },
    plus() {
      this.modelNumber = `${++this.modelNumber}`;
    },
    downloadPlus() {
      this.modelDownloadNumber = `${++this.modelDownloadNumber}`;
    },
    stakedPlus() {
      this.modelStakedNumber = `${++this.modelStakedNumber}`;
    },
    lpPlus() {
      this.modelLPNumber = `${++this.modelLPNumber}`;
    },
    minus() {
      this.modelNumber = `${--this.modelNumber}`;
    },
    downloadMinus() {
      this.modelDownloadNumber = `${--this.modelDownloadNumber}`;
    },
    stakedMinus() {
      this.modelStakedNumber = `${--this.modelStakedNumber}`;
    },
    lpMinus() {
      if (parseFloat(this.modelLPNumber) - 1 > 0) {
        this.modelLPNumber = `${--this.modelLPNumber}`;
      } else {
        this.modelLPNumber = "0";
      }
    },
    analyticsViewClick(pair) {
      if (pair == "xGAMMA") this.$router.push({ name: "Visr" });
      else {
        const routePair = this.PairAnalyticItems.filter(
          (obj) => obj.pairName === this.core.translateWETH(pair)
        )[0].route;

        this.$router.push({ name: "Analytics", params: { pair: routePair } });
      }
    },
    valutDetailClick(pair) {
      this.$route.params.pair = pair.toLowerCase();
      this.$router.push({ name: "VaultDetail" });
    },
    selectRow(e, v, pair) {
      v = v + this.dataTable.pagination.start - 1;
      this.activeAludel = pair;
      this.core.currentPair = this.core.translateWETH(this.activeAludel);

      const i = this.rowSelects.indexOf(`${v}`);
      for (let i = 0; i < this.dataTable.data.length; i++) {
        this.selects[i] = false;
      }
      this.selects[v] = true;

      if (i > -1) {
        this.rowSelects = [];
        // this.rowSelects.splice(i, 1)
        for (let i = 0; i < this.dataTable.data.length; i++) {
          this.selects[i] = false;
        }
      } else {
        this.rowSelects = [];
        this.rowSelects.push(`${v - this.dataTable.pagination.start + 1}`);

        for (let i = 0; i < this.dataTable.data.length; i++) {
          this.selects[i] = false;
        }
        this.selects[v] = true;
      }
      e.preventDefault();
      e.stopPropagation();
    },
    submit() {
      this.isLoading = true;
      this.loading.loadingText = "Submitting...";
      this.loading.state = "loading";
      this.progress.loading = true;
      if (this.progress.initialStep == 0) {
        this.approve();
      } else {
        this.signLock();
      }
    },
    close() {
      this.isLoading = false;
      //this.loading.state = "loading"
      this.progress.loading = false;
      this.$refs.modal.hide();
      this.$refs.modalStaked.hide();
      this.$refs.modalLP.hide();
    },
    submitStaked() {
      this.isLoading = true;
      this.loading.loadingText = "Submitting...";
      this.loading.state = "loading";
      this.progress.loading = true;
      // if (this.activeAludel == "GAMMA") {
      //   this.transferERC20();
      // }
      if (this.activeAludel == "xGAMMA") {
        this.withdrawVVISR();
      }
    },
    submitLP() {
      if (!this.vaultWalletSelected) {
        this.vaultWalletSelected = true;
      } else {
        this.isLoading = true;
        this.loading.loadingText = "Submitting...";
        this.loading.state = "loading";
        this.progress.loading = true;
        this.withdrawLP();
      }
    },
    closeStaked() {
      this.stackedNumberPercentage = "0";
      this.lpNumberPercentage = "0";
      this.$refs.modalStaked.hide();
    },
    closeLP() {
      this.$refs.modalLP.hide();
    },
    goToDownloadStep(i) {
      this.isLoading = true;
      this.loading.loadingText = "Submiting...";
      this.loading.state = "loading";
      this.progress.loading = true;
      setTimeout(() => {
        this.isLoading = false;
        this.progress.loading = false;
        this.downloadProgress.initialStep = i;
        if (i === 0) this.downloadProgress.step1 = false;
        else this.downloadProgress.step1 = true;
      }, 1000);
    },
  },
};
</script>

<style lang="scss">
@import "../assets/css/main-theme.scss";
.cv-overflow-menu-item .bx--overflow-menu-options__btn {
  background: $hover-secondary;
  color: #fff;
  &:hover {
    background: $active-secondary;
    color: #fff;
  }
  &:focus {
    outline: 2px solid transparent;
  }
}
.table-cell-tooltip {
  color: inherit !important;
  font-size: inherit !important;
}
// move analystic button on mobile view
@media screen and (max-width: 42rem) {
  .bx--overflow-menu-options__content {
    margin-left: -70px;
  }
}
</style>
