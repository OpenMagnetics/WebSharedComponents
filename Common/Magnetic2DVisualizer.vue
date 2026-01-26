<script>
import { waitForMkf } from '../assets/js/mkfRuntime.js';

// Constants
const ASPECT_RATIO_THRESHOLD = 0.85;
const OPTIONS_HEIGHT_MULTIPLIER = 0.90;
const DEBOUNCE_DELAY_MS = 20;
const WARNING_CHECK_DELAY_MS = 500;
const PLOT_DELAY_MS = 10;

// Plot modes - exported for external use
export const PLOT_MODES = {
    BASIC: 'basic',                         // Basic view with cores and wires
    MAGNETIC_FIELD: 'magnetic_field',       // Magnetic field plot
    ELECTRIC_FIELD: 'electric_field',       // Electric field plot
    WIRES_LOSSES: 'wires_losses',           // Wire losses plot (TBD)
    COLORED_BY_WINDING: 'colored_by_winding', // Turns colored by same winding (TBD)
    COLORED_BY_PARALLEL: 'colored_by_parallel', // Turns colored by same parallel (TBD)
    COLORED_BY_TURN: 'colored_by_turn',     // Turns colored by same turn (TBD)
};

// Human-readable labels for plot modes
const PLOT_MODE_LABELS = {
    [PLOT_MODES.BASIC]: 'Basic',
    [PLOT_MODES.MAGNETIC_FIELD]: 'H Field',
    [PLOT_MODES.ELECTRIC_FIELD]: 'E Field',
    [PLOT_MODES.WIRES_LOSSES]: 'Wire Losses',
    [PLOT_MODES.COLORED_BY_WINDING]: 'By Winding',
    [PLOT_MODES.COLORED_BY_PARALLEL]: 'By Parallel',
    [PLOT_MODES.COLORED_BY_TURN]: 'By Turn',
};

// Utility function to extract dimension from SVG string
function extractSvgDimension(svgHtml, dimension) {
    const regex = new RegExp(`${dimension}="(\\d*\\.)?\\d+"`, 'i');
    const match = svgHtml.match(regex);
    if (match && match.length > 0) {
        const numberMatch = match[0].match(/(\d*\.)?\d+/g);
        if (numberMatch) {
            return parseFloat(numberMatch[0]);
        }
    }
    return 0;
}

export default {
    emits: ["zoomIn", "zoomOut", "plotModeChange", "swapIncludeFringing", "errorInImage"],
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
        forceUpdate: {
            type: Number,
            default: 0,
        },
        enableZoom: {
            type: Boolean,
            default: true,
        },
        enableOptions: {
            type: Boolean,
            default: true,
        },
        enableFringingOption: {
            type: Boolean,
            default: false,
        },
        enableHideOnFitting: {
            type: Boolean,
            default: true,
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        plotModeInit: {
            type: String,
            default: PLOT_MODES.BASIC,
            validator: (value) => Object.values(PLOT_MODES).includes(value),
        },
        availablePlotModes: {
            type: Array,
            default: () => [
                PLOT_MODES.BASIC,
                PLOT_MODES.MAGNETIC_FIELD,
                PLOT_MODES.ELECTRIC_FIELD,
            ],
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
        textColor: {
            type: String,
            default: "#ffffff",
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
        zoomedInit: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            posting: false,
            zoomingPlot: this.zoomedInit,
            currentPlotMode: this.plotModeInit,
            includeFringing: this.includeFringingInit,
            blockingRebounds: false,
            recentChange: false,
            tryingToPlot: false,
            showWarning: false,
            lastSimulatedInputs: "",
            lastSimulatedMagnetics: "",
            errorMessage: "",
            width: "75%",
            PLOT_MODES,
            PLOT_MODE_LABELS,
        };
    },
    computed: {
        showFringingOption() {
            return this.currentPlotMode === PLOT_MODES.MAGNETIC_FIELD && (this.enableOptions || this.enableFringingOption);
        },
        currentModeLabel() {
            return PLOT_MODE_LABELS[this.currentPlotMode] || 'Basic';
        },
    },
    watch: {
        forceUpdate: {
            handler() {
                this.handleModelChange(true);
            },
            deep: true,
        },
        operatingPointIndex: {
            handler() {
                this.handleModelChange(false);
            },
            deep: true,
        },
        plotModeInit(newValue) {
            this.currentPlotMode = newValue;
        },
        includeFringingInit(newValue) {
            this.includeFringing = newValue;
        },
    },
    methods: {
        handleModelChange(checkWarning = false) {
            if (this.blockingRebounds) {
                return;
            }
            if (this.modelValue.magnetic == null || this.modelValue.inputs == null) {
                return;
            }

            const inputsString = JSON.stringify(this.modelValue.inputs);
            const magneticsString = JSON.stringify(this.modelValue.magnetic);

            if (inputsString === this.lastSimulatedInputs && magneticsString === this.lastSimulatedMagnetics) {
                return;
            }

            // Set posting immediately to dim the old image
            this.posting = true;
            this.blockingRebounds = true;
            this.zoomingPlot = false;
            this.currentPlotMode = this.plotModeInit;
            this.includeFringing = this.includeFringingInit;
            this.zoomOut();
            this.recentChange = true;
            this.tryToPlot();

            setTimeout(() => { this.blockingRebounds = false; }, DEBOUNCE_DELAY_MS);
            if (checkWarning) {
                setTimeout(() => this.checkShowWarning(), WARNING_CHECK_DELAY_MS);
            }

            this.lastSimulatedInputs = inputsString;
            this.lastSimulatedMagnetics = magneticsString;
        },
        checkShowWarning() {
            this.showWarning = !this.coilFits && !(this.posting || this.tryingToPlot || this.recentChange);
        },
        tryToPlot() {
            if (this.tryingToPlot) {
                return;
            }
            this.recentChange = false;
            this.tryingToPlot = true;
            setTimeout(() => {
                if (this.recentChange) {
                    this.tryingToPlot = false;
                    this.tryToPlot();
                } else {
                    setTimeout(() => {
                        this.posting = true;
                        this.plot();
                    }, PLOT_DELAY_MS);
                }
            }, this.$settingsStore.waitingTimeForPlottingAfterChange);
        },
        processSvgResult(result) {
            const isValidSvg = result.startsWith("<svg");
            if (!isValidSvg) {
                this.handlePlotError();
                return;
            }

            this.$refs.plotView.innerHTML = result;

            if (this.$refs.Magnetic2DVisualizerContainer == null) {
                this.posting = false;
                return;
            }

            const clientWidth = this.$refs.Magnetic2DVisualizerContainer.clientWidth;
            const clientHeight = this.$refs.Magnetic2DVisualizerContainer.clientHeight * (this.enableOptions ? OPTIONS_HEIGHT_MULTIPLIER : 1);

            const originalWidth = extractSvgDimension(result, 'width');
            const originalHeight = extractSvgDimension(result, 'height');

            this.width = this.calculateSvgWidth(originalWidth, originalHeight, clientWidth, clientHeight);
            this.$refs.plotView.innerHTML = this.$refs.plotView.innerHTML.replace('width=', 'class="scaling-svg" width=');

            this.errorMessage = "";
            this.posting = false;
        },
        calculateSvgWidth(originalWidth, originalHeight, clientWidth, clientHeight) {
            if (originalWidth > originalHeight * ASPECT_RATIO_THRESHOLD) {
                return "100%";
            }
            const heightProportion = clientHeight / originalHeight;
            return `${originalWidth * heightProportion}px`;
        },
        handlePlotError() {
            this.posting = false;
            this.$emit("errorInImage");
            this.lastSimulatedInputs = "";
            this.lastSimulatedMagnetics = "";
        },
        clearPlotViews() {
            this.$refs.plotView.innerHTML = "";
            if ("zoomPlotView" in this.$refs) {
                this.$refs.zoomPlotView.innerHTML = "";
            }
        },
        async calculateBasicPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            try {
                const mkf = await waitForMkf();
                const result = await mkf.plot_turns(JSON.stringify(this.modelValue.magnetic));
                this.processSvgResult(result);
            } catch (error) {
                console.error('Error in calculateBasicPlot:', error);
            }
        },
        async calculateMagneticFieldPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            try {
                const mkf = await waitForMkf();
                const settings = JSON.parse(await mkf.get_settings());
                settings.painterSimpleLitz = true;
                settings.painterAdvancedLitz = false;
                settings.painterIncludeFringing = this.includeFringing;
                await mkf.set_settings(JSON.stringify(settings));

                const result = await mkf.plot_magnetic_field(
                    JSON.stringify(this.modelValue.magnetic),
                    JSON.stringify(this.modelValue.inputs.operatingPoints[this.operatingPointIndex])
                );
                this.processSvgResult(result);
            } catch (error) {
                console.error('Error in calculateMagneticFieldPlot:', error);
            }
        },
        async calculateElectricFieldPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            try {
                const mkf = await waitForMkf();
                const settings = JSON.parse(await mkf.get_settings());
                settings.painterSimpleLitz = true;
                settings.painterAdvancedLitz = false;
                await mkf.set_settings(JSON.stringify(settings));

                const result = await mkf.plot_electric_field(
                    JSON.stringify(this.modelValue.magnetic),
                    JSON.stringify(this.modelValue.inputs.operatingPoints[this.operatingPointIndex])
                );
                this.processSvgResult(result);
            } catch (error) {
                console.error('Error in calculateElectricFieldPlot:', error);
            }
        },
        // Wire losses plot - uses existing WASM function
        async calculateWiresLossesPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            try {
                const mkf = await waitForMkf();
                const settings = JSON.parse(await mkf.get_settings());
                settings.painterSimpleLitz = true;
                settings.painterAdvancedLitz = false;
                await mkf.set_settings(JSON.stringify(settings));

                const result = await mkf.plot_wire_losses(
                    JSON.stringify(this.modelValue.magnetic),
                    JSON.stringify(this.modelValue.inputs.operatingPoints[this.operatingPointIndex])
                );
                this.processSvgResult(result);
            } catch (error) {
                console.error('Error in calculateWiresLossesPlot:', error);
            }
        },
        // Placeholder for turns colored by winding - TBD in WASM
        calculateColoredByWindingPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            // TODO: Implement when WASM function is available
            // this.$mkf.ready.then(() => {
            //     const result = this.$mkf.plot_turns_colored_by_winding(JSON.stringify(this.modelValue.magnetic));
            //     this.processSvgResult(result);
            // });
            console.warn('Colored by winding plot not yet implemented in WASM');
            this.calculateBasicPlot(); // Fallback to basic plot
        },
        // Placeholder for turns colored by parallel - TBD in WASM
        calculateColoredByParallelPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            // TODO: Implement when WASM function is available
            // this.$mkf.ready.then(() => {
            //     const result = this.$mkf.plot_turns_colored_by_parallel(JSON.stringify(this.modelValue.magnetic));
            //     this.processSvgResult(result);
            // });
            console.warn('Colored by parallel plot not yet implemented in WASM');
            this.calculateBasicPlot(); // Fallback to basic plot
        },
        // Placeholder for turns colored by turn - TBD in WASM
        calculateColoredByTurnPlot() {
            if (this.modelValue.magnetic == null) {
                return;
            }
            if (this.modelValue.magnetic.coil.turnsDescription == null) {
                this.clearPlotViews();
                return;
            }

            // TODO: Implement when WASM function is available
            // this.$mkf.ready.then(() => {
            //     const result = this.$mkf.plot_turns_colored_by_turn(JSON.stringify(this.modelValue.magnetic));
            //     this.processSvgResult(result);
            // });
            console.warn('Colored by turn plot not yet implemented in WASM');
            this.calculateBasicPlot(); // Fallback to basic plot
        },
        zoomIn() {
            this.zoomingPlot = true;
            // Wait for Vue to render the modal before copying the content
            this.$nextTick(() => {
                if (this.$refs.plotView && this.$refs.zoomPlotView) {
                    this.$refs.zoomPlotView.innerHTML = this.$refs.plotView.innerHTML;
                    // Make the SVG fill the modal
                    const svg = this.$refs.zoomPlotView.querySelector('svg');
                    if (svg) {
                        svg.style.width = '100%';
                        svg.style.height = '100%';
                        svg.style.maxWidth = '100%';
                        svg.style.maxHeight = '100%';
                    }
                }
            });
            this.$emit("zoomIn");
        },
        zoomOut() {
            this.zoomingPlot = false;
            this.$emit("zoomOut");
        },
        setPlotMode(mode) {
            if (this.currentPlotMode === mode) {
                // Toggle back to basic if clicking the same mode
                this.currentPlotMode = PLOT_MODES.BASIC;
            } else {
                this.currentPlotMode = mode;
            }
            setTimeout(() => {
                this.posting = true;
                this.plot();
            }, PLOT_DELAY_MS);
            this.$emit("plotModeChange", this.currentPlotMode);
        },
        swapIncludeFringing() {
            this.includeFringing = !this.includeFringing;
            setTimeout(() => {
                this.posting = true;
                this.plot();
            }, PLOT_DELAY_MS);
            this.$emit("swapIncludeFringing", this.includeFringing);
        },
        plot() {
            this.errorMessage = "";
            this.tryingToPlot = false;
            switch (this.currentPlotMode) {
                case PLOT_MODES.MAGNETIC_FIELD:
                    this.calculateMagneticFieldPlot();
                    break;
                case PLOT_MODES.ELECTRIC_FIELD:
                    this.calculateElectricFieldPlot();
                    break;
                case PLOT_MODES.WIRES_LOSSES:
                    this.calculateWiresLossesPlot();
                    break;
                case PLOT_MODES.COLORED_BY_WINDING:
                    this.calculateColoredByWindingPlot();
                    break;
                case PLOT_MODES.COLORED_BY_PARALLEL:
                    this.calculateColoredByParallelPlot();
                    break;
                case PLOT_MODES.COLORED_BY_TURN:
                    this.calculateColoredByTurnPlot();
                    break;
                case PLOT_MODES.BASIC:
                default:
                    this.calculateBasicPlot();
            }
        },
        showCoilAnyway() {
            this.$stateStore.wire2DVisualizerState.showAnyway = true;
        },
        getModeLabel(mode) {
            return PLOT_MODE_LABELS[mode] || mode;
        },
        isModeActive(mode) {
            return this.currentPlotMode === mode;
        },
    },
    mounted() {
        setTimeout(() => {
            this.posting = true;
            this.plot();
        }, PLOT_DELAY_MS);
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
        <!-- Zoom Modal -->
        <div v-if="enableZoom && zoomingPlot" class="zoom-modal-overlay" @click.self="zoomOut()">
            <div class="zoom-modal-overlay-bg" :style="{ backgroundColor: backgroundColor }">
            </div>
            <div class="zoom-modal-content" :style="{ backgroundColor: backgroundColor }">
                <button class="zoom-modal-close" :style="{ color: textColor }" @click="zoomOut()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="zoom-modal-image" ref="zoomPlotView"></div>
            </div>
        </div>

        <div v-show="!zoomingPlot">
            <div class="position-relative">
                <!-- Loading overlay -->
                <div v-if="posting" class="loading-overlay">
                    <img data-cy="CorePublish-loading" class="loading-spinner" alt="loading" :src="loadingGif">
                </div>
                <!-- Plot content with dimmed effect when loading -->
                <div :class="{ 'plot-loading': posting }">
                    <div data-cy="MagneticAdvise-core-field-plot-image" ref="plotView" class="mt-2 scaling-svg-container"/>
                    <div v-if="enableZoom" class="text-center mt-1">
                        <button class="btn btn-sm btn-outline-secondary" @click="zoomIn()">
                            <i class="fas fa-expand"></i> Expand
                        </button>
                    </div>
                    <div v-if="modelValue.magnetic != null && enableOptions && modelValue.magnetic.coil.turnsDescription != null" class="text-center">
                        <template v-for="mode in availablePlotModes" :key="mode">
                            <button
                                v-if="mode !== PLOT_MODES.BASIC"
                                :style="buttonStyle"
                                class="btn mt-1 ms-1"
                                :class="isModeActive(mode) ? 'btn-success' : 'btn-primary'"
                                @click="setPlotMode(mode)"
                            >
                                {{ isModeActive(mode) ? 'Hide ' : 'Show ' }}{{ getModeLabel(mode) }}
                            </button>
                        </template>
                    </div>
                    <div v-if="modelValue.magnetic != null && showFringingOption && modelValue.magnetic.coil.turnsDescription != null" class="text-center">
                        <button
                            :style="buttonStyle"
                            class="btn btn-primary ms-1 mt-1"
                            @click="swapIncludeFringing()"
                        >
                            {{ includeFringing ? 'Exclude Fringing' : 'Include Fringing' }}
                        </button>
                    </div>
                </div>
            </div>
            <label :data-cy="dataTestLabel + '-ErrorMessage'" class="text-danger m-0" style="font-size: 0.9em"> {{errorMessage}}</label>
        </div>
    </div>

</template>

<style>

    .Magnetic2DVisualizer {
/*        overflow-y: auto; */
        overflow: visible;
        width: auto;
        height: auto;
    }

.scaling-svg {
    object-fit: contain;
    height: auto;
    max-height: 50vh;
    width: auto;
    max-width: 100%;
    left: 0; 
    top: 0;
}

.scaling-svg-container {
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 50vh;
}

.plot-loading {
    opacity: 0.3;
    filter: brightness(0.5);
    transition: opacity 0.2s ease, filter 0.2s ease;
}

.loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
}

.loading-spinner {
    height: auto;
    max-width: 100px;
}

/* Zoom Modal Styles */
.zoom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.zoom-modal-overlay-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
    pointer-events: none;
}

.zoom-modal-content {
    border-radius: 8px;
    padding: 20px;
    width: 90vw;
    height: 90vh;
    position: relative;
    display: flex;
    flex-direction: column;
}

.zoom-modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 1;
}

.zoom-modal-close:hover {
    opacity: 0.7;
}

.zoom-modal-image {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 0;
    overflow: hidden;
}

.zoom-modal-image svg {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
</style>