<script setup>
import { toTitleCase, getMultiplier, isString, combinedStyle, combinedClass } from '../assets/js/utils.js'
import DimensionUnit from './DimensionUnit.vue'
import { tooltipsMagneticSynthesisDesignRequirements } from '../assets/js/texts.js'

</script>
<script>
export default {
    props: {
        name:{
            required: true
        },
        modelValue:{
            type: Object,
            required: true
        },
        options:{
            required: true
        },
        replaceTitle:{
            type: String
        },
        titleSameRow:{
            type: Boolean,
            default: false
        },
        altText:{
            type: String
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        optionsToDisable: {
            type: Array,
            default: [],
        },
        justifyContent: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        labelWidthProportionClass: {
            type: String,
            default: "col-4",
        },
        selectStyleClass: {
            type: String,
            default: "col-8",
        },
        valueFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        labelFontSize: {
            type: [String, Object],
            default: 'fs-6'
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
        var localData = this.assignLocalData(this.options)

        return {
            localData
        }
    },
    computed: {
        computedOptions() {
            if (this.options.constructor.name === "Array") {
                return this.options;
            }
            else {
                const computedOptions = []
                for (let [key, value] of Object.entries(this.options)) {
                    computedOptions.push(value)
                }
                return computedOptions;
            }
        },
        chosenOption() {
            console.log(this.options.constructor.name)
            console.log(this.modelValue[this.name])
            if (this.options.constructor.name === "Array") {
                return this.modelValue[this.name];
            }
            else {
                var chosen = null;
                for (let [key, value] of Object.entries(this.options)) {
                    if (this.modelValue[this.name] == key) {
                        this.modelValue[this.name] = value;
                        break;
                    }
                }
                return chosen;
            }
        },
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    width: '400px',
                    "text-align": "start",
                },
            }
        },
    },
    watch: {
        'options': {
            handler(newValue, oldValue) {
                this.localData = this.assignLocalData(newValue);
            },
            deep: true
        },
        'modelValue': {
            handler(newValue, oldValue) {
                this.localData = this.assignLocalData(this.options);
            },
            deep: true
        },
    },
    mounted () {
    },
    methods: {
        assignLocalData(options) {
            var localData;
            if (options.constructor.name === "Array") {
                localData = this.modelValue[this.name];
            }
            else {
                const computedOptions = []
                for (let [key, value] of Object.entries(options)) {
                    if (this.modelValue[this.name] == key) {
                        localData = value;
                        break;
                    }
                }
            }
            return localData;
        },
        changeOption(event) {
            var chosen = null;

            if (this.options.constructor.name === "Array") {
                for (var i = this.options.length - 1; i >= 0; i--) {
                    if (event.target.value == this.options[i]) {
                        chosen = this.options[i];
                    }
                }
            }
            else{
                for (let [key, value] of Object.entries(this.options)) {
                    if (event.target.value == value) {
                        chosen = key;
                        break;
                    }
                }
            }
            this.modelValue[this.name] = chosen;
            this.localData = event.target.value;
            this.$emit("update", chosen, this.name);
        },
    }
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" v-tooltip="styleTooltip" class="container-flex">
        <div v-tooltip="tooltipsMagneticSynthesisDesignRequirements['changeNameWindings']" class="row">
            <input
                :style="combinedStyle([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                v-if="altText != null && !titleSameRow"
                :data-cy="dataTestLabel + '-alt-title-label'"
                type="text"
                :class="combinedClass([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                class="rounded-2 ms-3 col-11 p-0 mb-2 border-0"
                @change="$emit('changeText', $event.target.value)"
                :value="altText">
            <label
                :style="combinedStyle([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                v-if="altText == null && !titleSameRow"
                :class="combinedClass([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                class="rounded-2 p-0">{{replaceTitle == null? toTitleCase(name) : toTitleCase(replaceTitle)}}
            </label>
        </div>
        <div class="row" :class="justifyContent? 'd-flex justify-content-between' : ''">
            <label
                :style="combinedStyle([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-same-row-label'"
                v-if="titleSameRow"
                :class="combinedClass([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                class="rounded-2 m-0 p-0">{{replaceTitle == null? toTitleCase(name) : toTitleCase(replaceTitle)}}
            </label>
            <div  v-if="!titleSameRow" class=" col-sm-0 col-md-2">
            </div>
            <select
                :style="combinedStyle([selectStyleClass, valueFontSize, disabled? labelBgColor : valueBgColor, textColor])"
                :disabled="disabled"
                :data-cy="dataTestLabel + '-select'"
                :class="combinedClass([selectStyleClass, valueFontSize, disabled? labelBgColor : valueBgColor, textColor, disabled? 'border-0 text-end':''])"
                class="form-select py-1 px-2 m-0 mt-1 pe-5"
                @change="changeOption"
                style="width:auto; max-height: 3em;"
                :value="localData"
            >
                <option :disabled="optionsToDisable.includes(value)" v-for="value in computedOptions">
                    {{value}}
                </option>
            </select>
        </div>
    </div>
</template>