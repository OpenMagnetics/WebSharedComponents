<script setup>
import { deepCopy } from '../assets/js/utils.js'

</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        wire: {
            type: Object,
            required: true,
        },
        forceUpdate:{
            type: Number,
            default: 0
        },
        operatingPoint: {
            type: Object,
            required: false,
        },
        includeCurrentDensity: {
            type: Boolean,
            default: true,
        },
        windingIndex: {
            type: Number,
            default: 0,
        },
        loadingGif: {
            type: String,
            default: "/images/loading.gif",
        },
        backgroundColor: {
            type: String,
            default: "#1a1a1a",
        },
    },
    data() {
        const posting = false
        const recentChange = false
        const tryingToSend = false
        const lastUsedWire = "";
        const style = getComputedStyle(document.body);
        return {
            posting,
            recentChange,
            tryingToSend,
            lastUsedWire,
        }
    },
    watch: {
        'forceUpdate': {
            handler(newValue, oldValue) {
                const wiresString = JSON.stringify(this.wire);
                if (wiresString != this.lastUsedWire) {
                    this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] = null;
                    this.tryToSend();
                    this.lastUsedWire = wiresString;
                }
            },
            deep: true
        },
    },
    methods: {
        computeWireRemotely() {
            if (!this.posting && this.wire != null) {
                this.$mkf.ready.then(_ => {
                    const aux = deepCopy(this.wire);
                    // var core = JSON.parse(crossReferencers.get_wire_data(JSON.stringify(aux), false));
                    // var core = JSON.parse(crossReferencers.get_wire_data_by_name(JSON.stringify(aux), false));
                    this.posting = true;

                    var url;
                    var data;
                    if (this.includeCurrentDensity) {
                        data = {wire: this.wire, operatingPoint: this.operatingPoint}
                        url = import.meta.env.VITE_API_ENDPOINT + '/plot_wire_and_current_density';
                    }
                    else {
                        data = {wire: this.wire}
                        url = import.meta.env.VITE_API_ENDPOINT + '/plot_wire';
                    }

                    this.$axios.post(url, data)
                    .then(response => {
                        this.posting = false
                        // console.log(response.data)
                        this.$refs.wire2DPlotView.innerHTML = response.data
                        this.$refs.wire2DPlotView.innerHTML = this.$refs.wire2DPlotView.innerHTML.replace(`<svg`, `<svg class="h-100 w-100"`);
                        this.$refs.wire2DPlotView.innerHTML = this.$refs.wire2DPlotView.innerHTML.replace(`width="300" height="300"`,
                            `width="${this.$refs.wire2DPlotViewContainer.clientWidth}" height="${this.$refs.wire2DPlotViewContainer.clientHeight}"`);
                        this.$refs.wire2DPlotView.innerHTML = this.$refs.wire2DPlotView.innerHTML.replaceAll(`stroke="rgb(  0,   0,   0)" d="M0.00,`, `stroke="${this.backgroundColor}" d="M0.00,`);
                        this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] = this.$refs.wire2DPlotView.innerHTML;
                    })
                    .catch(error => {
                        this.$refs.wire2DPlotView.innerHTML = "Error in wire";
                        this.posting = false
                    });

                }).catch(error => {
                    console.error(error);
                });
            }
        },
        computeWireLocally() {
            if (!this.posting && this.wire != null) {
                this.$mkf.ready.then(_ => {
                    const aux = deepCopy(this.wire);
                    this.posting = true;
                    this.$mkf.ready.then(_ => {
                        const result = this.$mkf.plot_wire(JSON.stringify(this.wire));
                        this.$refs.wire2DPlotView.innerHTML = result;
                        this.posting = false;

                        var clientWidth = this.$refs.wire2DPlotViewContainer.clientWidth;
                        var clientHeight = this.$refs.wire2DPlotViewContainer.clientHeight * 0.90;
                        var originalWidth = 0;
                        var originalHeight = 0;
                        {
                            const regex = /width="(\d*\.)?\d+"/i;
                            const aux = this.$refs.wire2DPlotView.innerHTML.match(regex)[0];
                            const regex2 = /(\d*\.)?\d+/g;
                            var match = aux.match(regex2);
                            originalWidth = Array.from(match)[0];
                        }
                        {
                            const regex = /height="(\d*\.)?\d+"/i;
                            const aux = this.$refs.wire2DPlotView.innerHTML.match(regex)[0];
                            const regex2 = /(\d*\.)?\d+/g;
                            var match = aux.match(regex2);
                            originalHeight = Array.from(match)[0];
                        }

                        if (originalWidth > originalHeight * 0.85) {
                            this.widthProportion = "100%";
                        }
                        else {
                            const originalProportion = originalWidth / (originalHeight * 0.85)
                            this.widthProportion = `${originalProportion * 100}%`;
                        }

                        this.$refs.wire2DPlotView.innerHTML = this.$refs.wire2DPlotView.innerHTML.replace(`width=`, `class="scaling-wire-svg" width=`);
                        this.$refs.wire2DPlotView.innerHTML = this.$refs.wire2DPlotView.innerHTML.replace(`<svg`, `<svg class="h-100 w-100"`);
                        this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] = this.$refs.wire2DPlotView.innerHTML;
                    })

                }).catch(error => {
                    console.error(error);
                });
            }
        },

        tryToSend() {
            if (this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex] == null) {
                if (!this.tryingToSend) {
                    this.recentChange = false;
                    this.tryingToSend = true;
                    setTimeout(() => {
                        if (!this.hasError) {
                            if (this.recentChange) {
                                this.tryingToSend = false;
                                this.tryToSend();
                            }
                            else {
                                this.tryingToSend = false;
                                if (this.includeCurrentDensity || this.wire.type == "litz") {
                                    this.computeWireRemotely();
                                }
                                else {
                                    this.computeWireLocally();
                                }
                            }
                        }
                    }
                    , this.$settingsStore.waitingTimeForPlottingAfterChange);
                }
            }
            else {
                this.$refs.wire2DPlotView.innerHTML = this.$stateStore.wire2DVisualizerState.plotCurrentViews[this.windingIndex];
            }
        },

    },
    mounted() {
        this.tryToSend();
    },
    computed: {
    },
};
</script>

<template>
    <div class="mt-2 wire2DPlotViewer text-center mx-auto" ref="wire2DPlotViewContainer">
        <img :data-cy="dataTestLabel + 'Wire2DVisualizer-loading'" v-if="posting" class="mx-auto d-block col-12" alt="loading" style="width: auto; height: 20vh;" :src="loadingGif">
        <div :data-cy="dataTestLabel + 'Wire2DVisualizer-core-field-plot-image'" v-show="!posting" ref="wire2DPlotView" style="width: auto; height: 20vh;" />
    </div>
</template>

<style>

    .wire2DPlotViewer {
/*        resize: horizontal;*/
        overflow: hidden;
        width: auto;
        height: auto;
    }
.scaling-wire-svg {
    object-fit: contain;
    height: 100%; 
    width: v-bind(widthProportion);
    left: 0; 
    top: 0;
}
</style>