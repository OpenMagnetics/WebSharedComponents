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
            default: () => [],
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
            default: () => ({ fontSize: '0.875rem' })
        },
        labelFontSize: {
            type: [String, Object],
            default: () => ({ fontSize: '0.875rem' })
        },
        labelBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-surface-800)' }),
        },
        valueBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-surface-600)' }),
        },
        textColor: {
            type: [String, Object],
            default: () => ({ color: 'var(--p-surface-50)' }),
        },
    },
    data() {
        const localData = this.modelValue ? this.assignLocalData(this.options) : null;

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
            if (this.options.constructor.name === "Array") {
                return this.modelValue[this.name];
            }
            else {
                let chosen = null;
                for (let [key, value] of Object.entries(this.options)) {
                    if (this.modelValue[this.name] == key) {
                        this.modelValue[this.name] = value;
                        break;
                    }
                }
                return chosen;
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
            if (!this.modelValue) return null;
            
            let localData;
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
            let chosen = null;

            if (this.options.constructor.name === "Array") {
                for (let i = this.options.length - 1; i >= 0; i--) {
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
            this.$emit("model-changed", chosen, this.name);
        },
    }
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex">
        <div class="row">
            <input
                :style="combinedStyle([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                v-if="altText != null && !titleSameRow"
                :data-cy="dataTestLabel + '-alt-title-label'"
                type="text"
                :class="combinedClass([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                class="efl-label ms-3 col-11 p-0 mb-2 border-0"
                @change="$emit('changeText', $event.target.value)"
                :value="altText">
            <label
                :style="combinedStyle([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                v-if="altText == null && !titleSameRow"
                :class="combinedClass([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                class="efl-label p-0">{{replaceTitle == null? toTitleCase(name) : replaceTitle}}
            </label>
        </div>
        <div class="row" :class="justifyContent? 'd-flex justify-content-between' : ''">
            <label
                :style="combinedStyle([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-same-row-label'"
                v-if="titleSameRow"
                :class="combinedClass([labelWidthProportionClass, labelFontSize, labelBgColor, textColor])"
                class="efl-label m-0 p-0">{{replaceTitle == null? toTitleCase(name) : replaceTitle}}
            </label>
            <div  v-if="!titleSameRow" class=" col-sm-0 col-md-2">
            </div>
            <select
                :style="combinedStyle([selectStyleClass, valueFontSize, disabled? labelBgColor : valueBgColor, textColor])"
                :disabled="disabled"
                :data-cy="dataTestLabel + '-select'"
                :class="combinedClass([selectStyleClass, valueFontSize, disabled? labelBgColor : valueBgColor, textColor, disabled? 'border-0 text-end':''])"
                class="efl-select py-1 px-2 m-0 mt-1 pe-5"
                @change="changeOption"
                style="width:auto; max-height: 3em;"
                :value="localData"
            >
                <option :disabled="optionsToDisable.includes(value)" v-for="value in computedOptions" :key="value">
                    {{value}}
                </option>
            </select>
        </div>
    </div>
</template>

<style scoped>
.efl-label {
    font-size: clamp(0.6rem, 2cqi, 0.875rem);
    overflow: hidden;
    white-space: nowrap;
    container-type: inline-size;
    border-radius: var(--p-border-radius);
}

.efl-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border: 1px solid var(--p-surface-400);
    border-radius: var(--p-border-radius);
    font-family: var(--p-font-family);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    height: 1.75rem;
    line-height: 1.25rem;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23e9ecef' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    background-size: 12px 9px;
}

.efl-select:disabled {
    background-image: none;
}

.efl-select:focus {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 0 0.15rem color-mix(in srgb, var(--p-primary-color) 25%, transparent);
}
</style>