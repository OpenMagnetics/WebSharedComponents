<script setup>
import { deepCopy } from '../assets/js/utils.js'
import { initMvbWorker, drawDimensionedFrontView, drawDimensionedTopView, drawCoreGappingTechnicalDrawing } from '../assets/js/mvbRuntime.js'
</script>

<script>

export default {
    emits: ["errorInDimensions", "renderSuccess"],
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
            default: `${import.meta.env.BASE_URL}/images/loading.gif`,
        },
        backgroundColor: {
            type: String,
            default: "#1a1a1a",
        },
        gappingMode: {
            type: Boolean,
            default: false,
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
        async calculateTechnicalDrawing() {
            if (this.core == null) {
                return;
            }
            if (this.core.functionalDescription.shape == null) {
                if (this.$refs.frontView) this.$refs.frontView.innerHTML = "";
                if (this.$refs.topView) this.$refs.topView.innerHTML = "";
                return;
            }

            try {
                await initMvbWorker();
                const coreAux = deepCopy(this.core);
                coreAux.geometricalDescription = null;
                coreAux.processedDescription = null;
                if (coreAux.functionalDescription?.shape?.familySubtype != null) {
                    coreAux.functionalDescription.shape.familySubtype =
                        String(coreAux.functionalDescription.shape.familySubtype);
                }
                const magnetic = { core: coreAux };
                const width = this.$refs.Core2DVisualizerContainer?.clientWidth || 400;

                if (this.gappingMode) {
                    const gapSvg = await drawCoreGappingTechnicalDrawing(magnetic, width, 12, '#aaaaaa', '#4499ff');
                    if (this.$refs.frontView) this.$refs.frontView.innerHTML = gapSvg;
                    if (this.$refs.topView) this.$refs.topView.innerHTML = '';
                } else {
                    const [frontSvg, topSvg] = await Promise.all([
                        drawDimensionedFrontView(magnetic, width, 12, '#aaaaaa', '#4499ff'),
                        drawDimensionedTopView(magnetic, width, 12, '#aaaaaa', '#4499ff'),
                    ]);
                    if (this.$refs.frontView) this.$refs.frontView.innerHTML = frontSvg;
                    if (this.$refs.topView) this.$refs.topView.innerHTML = topSvg;
                }
                this.errorMessage = "";
                this.$emit('renderSuccess');
            } catch (error) {
                console.error('[Core2DVisualizer]', error);
                this.$emit('errorInDimensions');
            } finally {
                this.posting = false;
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
