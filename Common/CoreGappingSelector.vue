<script setup>
import { guessBasicGappingParameters, combinedStyle } from '../assets/js/utils.js'
import { gapTypes } from '../assets/js/defaults.js'
import ElementFromList from '../DataInput/ElementFromList.vue'
import Dimension from '../DataInput/Dimension.vue'
import { tooltipsMagneticBuilder } from '../assets/js/texts.js'
</script>
<script>
export default {
    props: {
        title:{
            type: String,
            default: '',
        },
        core:{
            type: Object,
            required: true
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        forceUpdate:{
            type: Number,
            default: 0
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        autoupdate: {
            type: Boolean,
            default: true,
        },
        scale: {
            type: Number,
            default: 1000,
        },
        valueFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        labelFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        labelWidthProportionClass:{
            type: String,
            default: 'col-xs-12 col-md-4'
        },
        valueWidthProportionClass:{
            type: String,
            default: 'col-xs-8 col-md-8'
        },
        labelBgColor: {
            type: [String, Object],
            default: "bg-dark",
        },
        valueBgColor: {
            type: [String, Object],
            default: "bg-light",
        },
        textColor: {
            type: [String, Object],
            default: "text-white",
        },
    },
    data() {
        var localData = guessBasicGappingParameters(this.core, 1);

        const blockingRebounds = false;
        const errorMessages = "";
        return {
            localData,
            blockingRebounds,
            errorMessages,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    width: '200px',
                    "text-align": "start",
                },
            }
        },
    },
    watch: {
        forceUpdate(newValue, oldValue) {
            this.blockingRebounds = true;
            this.localData = guessBasicGappingParameters(this.core, 1);
            setTimeout(() => this.blockingRebounds = false, 10);
        },
    },
    mounted () {    
    },
    methods: {
        checkErrors() {
            var hasError = false;
            this.errorMessages = "";
            return hasError;
        },
        update() {
            const hasError = this.checkErrors();
            const gapping = [];
            const residualGap = {
                "length": 0.000005,
                "type": "residual"
            }
            if (this.localData.gapType == 'Ungapped') {
                gapping.push(residualGap);
                gapping.push(residualGap);
                gapping.push(residualGap);
            }
            else if (this.localData.gapType == 'Ground') {
                const coreGap = {
                    "length": this.localData.gapLength,
                    "type": "subtractive"
                }
                gapping.push(coreGap);
                gapping.push(residualGap);
                gapping.push(residualGap);
            }
            else if (this.localData.gapType == 'Spacer') {
                const coreGap = {
                    "length": this.localData.gapLength,
                    "type": "additive"
                }
                gapping.push(coreGap);
                gapping.push(coreGap);
                gapping.push(coreGap);
            }

            else if (this.localData.gapType == 'Distributed') {
                const coreGap = {
                    "length": this.localData.gapLength,
                    "type": "subtractive"
                }
                for (var i = this.localData.numberGaps - 1; i >= 0; i--) {
                    gapping.push(coreGap);
                }
                gapping.push(residualGap);
                gapping.push(residualGap);
            }

            if (this.autoupdate) {
                this.core['functionalDescription']['gapping'] = gapping;
            }

            if (!this.blockingRebounds) {
                if (!hasError) {
                    this.$emit("update", gapping);
                }
            }
        },
        gapTypeUpdated() {
        },
        gapLengthUpdated() {
        },
        numberGapsUpdated() {
        },
    }
}
</script>


<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex" ref="container">
        <div class="row" v-tooltip="styleTooltip">
            <label
                :style="combinedStyle([labelFontSize, labelBgColor, textColor])"
                v-tooltip="tooltipsMagneticBuilder.coreGapping"
                :data-cy="dataTestLabel + '-title'"
                class="rounded-2 col-12">
                {{title}}
            </label>
            <div class="offset-1 col-11">
                <ElementFromList
                    v-tooltip="tooltipsMagneticBuilder.coreGappingType"
                    class="col-12 text-start m-0 p-0"
                    :dataTestLabel="dataTestLabel + '-GapType'"
                    :name="'gapType'"
                    :replaceTitle="'Type'"
                    :disabled="disabled"
                    :justifyContent="false"
                    :titleSameRow="true"
                    :optionsToDisable="['Custom']"
                    v-model="localData"
                    :options="gapTypes"
                    :valueFontSize="valueFontSize"
                    :labelFontSize="labelFontSize"
                    :labelWidthProportionClass="'col-5'"
                    :valueWidthProportionClass="'col-6'"
                    :labelBgColor="labelBgColor"
                    :valueBgColor="valueBgColor"
                    :textColor="textColor"
                    @update="update"
                />

                <Dimension class="col-12 text-start"
                    v-tooltip="tooltipsMagneticBuilder.coreGappingLength"
                    v-if="localData.gapType != 'Ungapped'"
                    :name="'gapLength'"
                    :replaceTitle="'Length'"
                    :min="1e-6"
                    :max="0.1"
                    :disabled="disabled"
                    :forceUpdate="forceUpdate"
                    :justifyContent="false"
                    :unit="'m'"
                    :dataTestLabel="dataTestLabel + '-GapLength'"
                    :allowNegative="false"
                    :modelValue="localData"
                    :valueFontSize="valueFontSize"
                    :labelFontSize="labelFontSize"
                    :labelWidthProportionClass="'col-7'"
                    :valueWidthProportionClass="'col-5'"
                    :labelBgColor="labelBgColor"
                    :valueBgColor="valueBgColor"
                    :textColor="textColor"
                    @update="update"
                />

                <Dimension class="col-12 text-start"
                    v-tooltip="tooltipsMagneticBuilder.coreGappingNumberGaps"
                    :name="'numberGaps'"
                    :replaceTitle="'No. Gaps'"
                    v-if="localData.gapType == 'Distributed'"
                    :unit="null"
                    :disabled="disabled"
                    :forceUpdate="forceUpdate"
                    :justifyContent="false"
                    :min="1"
                    :max="100"
                    :dataTestLabel="dataTestLabel + '-NumberGaps'"
                    :allowNegative="false"
                    :modelValue="localData"
                    :valueFontSize="valueFontSize"
                    :labelFontSize="labelFontSize"
                    :labelWidthProportionClass="'col-7'"
                    :valueWidthProportionClass="'col-5'"
                    :labelBgColor="labelBgColor"
                    :valueBgColor="valueBgColor"
                    :textColor="textColor"
                    @update="update"
                />
            </div>
        </div>
    </div>
</template>


