<script setup>
import { toTitleCase, removeTrailingZeroes, formatInductance, formatPower, formatTemperature, formatResistance, deepCopy } from '../assets/js/utils.js'
</script>

<script>

export default {
    emits: ["zoomIn", "zoomOut", "swapFieldPlot", "swapIncludeFringing"],
    components: {
    },
    props: {
        modelValue:{
            type: Object,
            required: true
        },
        enableZoom: {
            type: Boolean,
            default: true,
        },
        enableOptions: {
            type: Boolean,
            default: true,
        },
        enableHideOnFitting: {
            type: Boolean,
            default: true,
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        showFieldPlotInit: {
            type: Boolean,
            default: false,
        },
        includeFringingInit: {
            type: Boolean,
            default: true,
        },
        coilFits: {
            type: Boolean,
            default: true,
        },
        backgroundColor: {
            type: String,
            default: "#1a1a1a",
        },
        buttonStyle: {
            type: [Object, String],
            default: "",
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
        loadingGif: {
            type: String,
            default: "/images/loading.gif",
        },
    },
    data() {
        const lastSimulatedInputs = "";
        const lastSimulatedMagnetics = "";
        const errorMessage = "";
        return {
            posting: false,
            zoomingPlot: false,
            showFieldPlot: this.showFieldPlotInit,
            includeFringing: this.includeFringingInit,
            blockingRebounds: false,
            recentChange: false,
            tryingToPlot: false,
            showWarning: false,
            lastSimulatedInputs,
            lastSimulatedMagnetics,
            errorMessage,
        }
    },
    watch: {
        'modelValue': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds) {

                    if (this.modelValue.magnetic == null) {
                        return;
                    }
                    if (this.modelValue.inputs == null) {
                        return;
                    }
                    const inputsString = JSON.stringify(this.modelValue.inputs);
                    const magneticsString = JSON.stringify(this.modelValue.magnetic);

                    if (inputsString != this.lastSimulatedInputs || magneticsString != this.lastSimulatedMagnetics) {

                        this.blockingRebounds = true;
                        this.zoomingPlot = false;
                        this.showFieldPlot = this.showFieldPlotInit;
                        this.includeFringing = this.includeFringingInit;
                        this.zoomOut();
                        this.recentChange = true;
                        this.tryToPlot();
                        setTimeout(() => this.blockingRebounds = false, 20);
                        setTimeout(() => this.checkShowWarning(), 500);

                        this.lastSimulatedInputs = inputsString;
                        this.lastSimulatedMagnetics = magneticsString;
                    }
                }
            },
          deep: true
        },
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds) {

                    if (this.modelValue.magnetic == null) {
                        return;
                    }
                    if (this.modelValue.inputs == null) {
                        return;
                    }
                    const inputsString = JSON.stringify(this.modelValue.inputs);
                    const magneticsString = JSON.stringify(this.modelValue.magnetic);

                    if (inputsString != this.lastSimulatedInputs || magneticsString != this.lastSimulatedMagnetics) {
                        this.blockingRebounds = true;
                        this.zoomingPlot = false;
                        this.showFieldPlot = this.showFieldPlotInit;
                        this.includeFringing = this.includeFringingInit;
                        this.zoomOut();
                        this.recentChange = true;
                        this.tryToPlot();
                        setTimeout(() => this.blockingRebounds = false, 20);
                    }
                }
            },
          deep: true
        },
        'showFieldPlotInit': {
            handler(newValue, oldValue) {
                this.showFieldPlot = this.showFieldPlotInit;
            },
          deep: true
        },
        'includeFringingInit': {
            handler(newValue, oldValue) {
                this.includeFringing = this.includeFringingInit;
            },
          deep: true
        },
    },
    methods: {
        checkShowWarning() {
            if (!this.coilFits && !(this.posting || this.tryingToPlot || this.recentChange)) {
                this.showWarning = true;
            }
            else {
                this.showWarning = false;
            }
        },
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
        calculateMagneticSectionAndFieldPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription != null) {
                this.posting = true;
                const url = import.meta.env.VITE_API_ENDPOINT + '/plot_core_and_fields'

                this.$refs.plotView.innerHTML = ""
                if ("zoomPlotView" in this.$refs) {
                    this.$refs.zoomPlotView.innerHTML = ""
                }
                this.$axios.post(url, {magnetic: this.modelValue.magnetic, operatingPoint: this.modelValue.inputs.operatingPoints[this.operatingPointIndex], includeFringing: this.includeFringing})
                .then(response => {
                    var clientWidth = this.$refs.Magnetic2DVisualizerContainer.clientWidth;
                    var clientHeight = this.$refs.Magnetic2DVisualizerContainer.clientHeight * 0.90;
                    const regex = /width="\d+" height="\d+" viewBox=/i;
                    this.$refs.plotView.innerHTML = response.data
                    const aux = this.$refs.plotView.innerHTML.match(regex)[0];
                    const regex2 = /\d+/g;
                    var match = aux.matchAll(regex2);
                    var originalDimensions = Array.from(match);
                    const originalProportion = originalDimensions[0] / originalDimensions[1]
                    if (originalProportion * clientHeight < clientWidth) {
                        clientWidth = originalProportion * clientHeight;
                    }
                    else {
                        clientHeight = clientWidth / originalProportion;
                    }


                    this.$refs.plotView.innerHTML = this.$refs.plotView.innerHTML.replace(regex, `class="" width="${clientWidth}" height="${clientHeight}" viewBox=`);
                    this.$refs.plotView.innerHTML = this.$refs.plotView.innerHTML.replaceAll(`stroke="rgb(  0,   0,   0)" d="M0.00,`, `stroke="${this.backgroundColor}" d="M0.00,`);
                    if ("zoomPlotView" in this.$refs) {
                        this.$refs.zoomPlotView.innerHTML = response.data
                        this.$refs.zoomPlotView.innerHTML = this.$refs.zoomPlotView.innerHTML.replace(`<svg`, `<svg class="h-100 w-100"`);
                        this.$refs.zoomPlotView.innerHTML = this.$refs.zoomPlotView.innerHTML.replaceAll(`stroke="rgb(  0,   0,   0)" d="M0.00,`, `stroke="${this.backgroundColor}" d="M0.00,`);
                        this.$refs.zoomPlotView.innerHTML = this.$refs.zoomPlotView.innerHTML.replace(regex, `class="" width="${clientWidth}" height="${clientHeight}" viewBox=`);
                    }
                    this.errorMessage = "";
                    this.posting = false;
                })
                .catch(error => {
                    this.posting = false;
                    console.error("Error plotting")
                    console.error(error)
                    this.errorMessage = "Error while winding magnetic. Try another configuration or report a bug if you think this should work";
                });
            }
            else {
                this.$refs.plotView.innerHTML = ""
                if ("zoomPlotView" in this.$refs) {
                    this.$refs.zoomPlotView.innerHTML = ""
                }
            }
        },
        calculateMagneticSectionPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription != null) {
                const url = import.meta.env.VITE_API_ENDPOINT + '/plot_core'

                this.$axios.post(url, {magnetic: this.modelValue.magnetic, operatingPoint: this.modelValue.inputs.operatingPoints[this.operatingPointIndex]})
                .then(response => {
                    if (this.$refs.Magnetic2DVisualizerContainer == null) {
                        this.posting = false;
                        return;
                    }
                    var clientWidth = this.$refs.Magnetic2DVisualizerContainer.clientWidth;
                    var clientHeight = this.$refs.Magnetic2DVisualizerContainer.clientHeight * 0.90;
                    const regex = /width="\d+" height="\d+" viewBox=/i;
                    this.$refs.plotView.innerHTML = response.data
                    const aux = this.$refs.plotView.innerHTML.match(regex)[0];
                    const regex2 = /\d+/g;
                    var match = aux.matchAll(regex2);
                    var originalDimensions = Array.from(match);
                    const originalProportion = originalDimensions[0] / originalDimensions[1]
                    if (originalProportion * clientHeight < clientWidth) {
                        clientWidth = originalProportion * clientHeight;
                    }
                    else {
                        clientHeight = clientWidth / originalProportion;
                    }

                    this.$refs.plotView.innerHTML = this.$refs.plotView.innerHTML.replace(regex, `class="" width="${clientWidth}" height="${clientHeight}" viewBox=`);
                    this.$refs.plotView.innerHTML = this.$refs.plotView.innerHTML.replaceAll(`stroke="rgb(  0,   0,   0)" d="M0.00,`, `stroke="${this.backgroundColor}" d="M0.00,`);
                    if ("zoomPlotView" in this.$refs) {
                        this.$refs.zoomPlotView.innerHTML = response.data
                        this.$refs.zoomPlotView.innerHTML = this.$refs.zoomPlotView.innerHTML.replace(`<svg`, `<svg class="h-100 w-100"`);
                        this.$refs.zoomPlotView.innerHTML = this.$refs.zoomPlotView.innerHTML.replace(regex, `class="" width="${clientWidth}" height="${clientHeight}" viewBox=`);
                        this.$refs.zoomPlotView.innerHTML = this.$refs.zoomPlotView.innerHTML.replaceAll(`stroke="rgb(  0,   0,   0)" d="M0.00,`, `stroke="${this.backgroundColor}" d="M0.00,`);
                    }
                    this.errorMessage = "";
                    this.posting = false;
                })
                .catch(error => {
                    this.posting = false;
                    console.error("Error plotting")
                    console.error(error)
                    this.errorMessage = "Error while winding magnetic. Try another configuration or report a bug if you think this should work";
                });
            }
            else {
                this.$refs.plotView.innerHTML = ""
                if ("zoomPlotView" in this.$refs) {
                    this.$refs.zoomPlotView.innerHTML = ""
                }
            }
        },

        zoomIn() {
            this.zoomingPlot = true;
            this.$emit("zoomIn");
        },
        zoomOut() {
            this.zoomingPlot = false;
            this.$emit("zoomOut");
        },
        swapFieldPlot() {
            this.showFieldPlot = !this.showFieldPlot;
            setTimeout(() => {
                this.posting = true;
                this.plot();
            }, 10);
            this.$emit("swapFieldPlot", this.showFieldPlot);
        },
        swapIncludeFringing() {
            this.includeFringing = !this.includeFringing;
            setTimeout(() => {
                this.posting = true;
                this.plot();
            }, 10);
            this.$emit("swapIncludeFringing", this.includeFringing);
        },
        plot() {
            this.errorMessage = "";
            this.tryingToPlot = false
            if (this.showFieldPlot) {
                this.calculateMagneticSectionAndFieldPlot();
            }
            else {
                this.calculateMagneticSectionPlot();
            }
        },
        showCoilAnyway() {
            this.$stateStore.wire2DVisualizerState.showAnyway = true;
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
    <div v-if="modelValue.magnetic != null && showWarning && modelValue.magnetic.coil.turnsDescription == null" class="container">
        <div class="row">
            <i class="col-12 fa-solid fa-9x fa-triangle-exclamation"></i>
            <label class="text-danger col-12 pt-1 fs-5" style="font-size: 1em">Winding turns not possible</label>
        </div>
    </div>
    <div v-if="showWarning && !$stateStore.wire2DVisualizerState.showAnyway" class="container">
        <div class="row">
            <i class="col-12 fa-solid fa-9x fa-triangle-exclamation"></i>
            <label class="text-danger col-12 pt-1 fs-5" style="font-size: 1em">Turns don't fit in winding window</label>
            <button class="btn btn-danger offset-3 col-6 fs-5" @click="showCoilAnyway()">Show me anyway</button>
        </div>
    </div>

    <div v-else class="m-0 p-0 Magnetic2DVisualizer text-center mx-auto" ref="Magnetic2DVisualizerContainer" style="height: 100%; width: 100%;">
        <div v-if="enableZoom" v-show="zoomingPlot" class="row mx-1" style="height: 100%;">
            <button class="btn" @click="zoomOut()">
                <label class="col-12 text-info fw-lighter" >(Click on image to go back)</label>
                <div data-cy="MagneticAdvise-core-field-plot-zoom-image" ref="zoomPlotView" :class="showFieldPlot? '' : ''" class="m-0" style="width: 100%;" />
            </button>
        </div>

        <div v-show="!zoomingPlot">
            <img data-cy="CorePublish-loading" v-if="posting" class="mx-auto d-block container" alt="loading" style="height: auto;" :src="loadingGif">

            <div v-show="!posting">
                <div>
                    <button
                        v-if="enableZoom"
                        class="btn"
                        @click="zoomIn()"
                    >
                        <label class="col-12 text-info fw-lighter">(Click on image to zoom in)</label>
                        <div data-cy="MagneticAdvise-core-field-plot-image" ref="plotView" :class="showFieldPlot? '' : ''" class="col-12 mt-2" style="height: 100%;" />
                    </button>
                    <div v-else data-cy="MagneticAdvise-core-field-plot-zoom-image" ref="plotView" :class="showFieldPlot? '' : ''" class="m-0 " style="height: 100%" />
                </div>
                <div class="text-center">
                    <button
                        :style="buttonStyle"
                        v-if="modelValue.magnetic != null && enableOptions && modelValue.magnetic.coil.turnsDescription != null"
                        class="btn btn-primary mt-1"
                        @click="swapFieldPlot()"
                    >
                        {{showFieldPlot? 'Hide H field' : 'Show H field'}}
                    </button>
                    <button
                        :style="buttonStyle"
                        v-if="modelValue.magnetic != null && showFieldPlot && enableOptions && modelValue.magnetic.coil.turnsDescription != null"
                        class="btn btn-primary ms-1 mt-1"
                        @click="swapIncludeFringing()"
                    >
                        {{includeFringing? 'Exclude Fringing H field' : 'Include Fringing H field'}}
                    </button>
                </div>
            </div>
            <label :data-cy="dataTestLabel + '-ErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{errorMessage}}</label>
        </div>
    </div>

</template>

<style>

    .Magnetic2DVisualizer {
        overflow: hidden;
        width: auto;
        height: auto;
    }
</style>