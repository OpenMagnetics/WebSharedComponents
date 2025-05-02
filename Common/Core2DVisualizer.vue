<script setup>
import { toTitleCase, removeTrailingZeroes, formatInductance, formatPower, formatTemperature, formatResistance, deepCopy } from '../assets/js/utils.js'
</script>

<script>

export default {
    emits: ["errorInDimensions"],
    components: {
    },
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        core: {
            type: Object,
            required: true,
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
        const errorMessage = "";
        return {
            posting: false,
            blockingRebounds: false,
            recentChange: false,
            tryingToPlot: false,
            errorMessage,
        }
    },
    watch: {
        'core': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds) {
                    this.blockingRebounds = true;
                    this.tryToPlot();
                    setTimeout(() => this.blockingRebounds = false, 20);
                }
            },
          deep: true
        },
    },
    methods: {
        tryToPlot() {
            if (!this.tryingToPlot) {
                this.recentChange = false
                this.tryingToPlot = true
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToPlot = false
                        this.tryToPlot()
                    }
                    else {
                        setTimeout(() => {
                            this.posting = true;
                            this.plot();
                        }, 10);
                    }
                }
                , this.$settingsStore.waitingTimeForPlottingAfterChange);
            }
        },
        calculateTechnicalDrawing() {
            if (this.core == null) {
                return;
            }
            if (this.core.functionalDescription.shape != null) {
                const url = import.meta.env.VITE_API_ENDPOINT + '/core_compute_technical_drawing'

                this.$axios.post(url, this.core.functionalDescription.shape)
                .then(response => {
                    console.log(response)
                    // return


                    var clientWidth = this.$refs.Core2DVisualizerContainer.clientWidth;
                    var clientHeight = this.$refs.Core2DVisualizerContainer.clientHeight * 0.90;
                    this.$refs.frontView.innerHTML = response.data.front_view;
                    this.$refs.topView.innerHTML = response.data.top_view;
                    this.errorMessage = "";
                    this.posting = false;
                })
                .catch(error => {
                    this.posting = false;
                    console.error("Error plotting")
                    console.error(error)
                });
            }
            else {
                this.$refs.plotView.innerHTML = ""
                if ("zoomPlotView" in this.$refs) {
                    this.$refs.zoomPlotView.innerHTML = ""
                }
            }
        },
        plot() {
            this.errorMessage = "";
            this.tryingToPlot = false
            this.calculateTechnicalDrawing();
        },
    },
    computed: {
    },
    mounted() {
        setTimeout(() => {
            this.posting = true;
            this.plot();
        }, 10);
    },
}

</script>

<template>
    <div class="m-0 p-0 Core2DVisualizer text-center mx-auto" ref="Core2DVisualizerContainer" >

        <div >
            <img data-cy="CorePublish-loading" v-if="posting" class="mx-auto d-block container" alt="loading" style="height: auto;" :src="loadingGif">

            <div v-show="!posting">
                <div>
                    <div data-cy="MagneticAdvise-core-field-plot-zoom-image" ref="frontView" class="m-0 " style="height: 50%" />
                    <div data-cy="MagneticAdvise-core-field-plot-zoom-image" ref="topView" class="m-0 " style="height: 50%" />
                </div>
            </div>
            <label :data-cy="dataTestLabel + '-ErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{errorMessage}}</label>
        </div>
    </div>

</template>

<style>

    .Core2DVisualizer {
        height:100%;
        overflow-y: auto; 
    }
</style>