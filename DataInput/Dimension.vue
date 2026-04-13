<script setup>
import { toTitleCase, getMultiplier, removeTrailingZeroes, combinedStyle, combinedClass } from '../assets/js/utils.js'
import DimensionUnit from './DimensionUnit.vue'
</script>
<script>
export default {
    emits: ['update'],
    props: {
        name:{
            type: String,
            required: true
        },
        unit:{
            type: String,
            default: null,
            required: false
        },
        modelValue:{
            type: Object,
            required: true
        },
        defaultValue:{
            type: Number
        },
        min:{
            type: Number,
            default: 1e-12
        },
        max:{
            type: Number,
            default: 1e+12
        },
        numberDecimals:{
            type: Number,
            default: 6
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        allowNegative:{
            type: Boolean,
            default: false
        },
        allowZero:{
            type: Boolean,
            default: false
        },
        altUnit:{
            type: String,
            default: null
        },
        visualScale:{
            type: Number,
            default: 1
        },
        useMetricPrefixes:{
            type: Boolean,
            default: true
        },
        forceUpdate:{
            type: Number,
            default: 0
        },
        replaceTitle:{
            type: String
        },
        justifyContent: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        valueFontSize: {
            type: [String, Object],
            default: () => ({ fontSize: '0.875rem' })
        },
        labelFontSize: {
            type: [String, Object],
            default: () => ({ fontSize: '0.875rem' })
        },
        labelWidthProportionClass:{
            type: String,
            default: 'col-xs-12 col-md-7'
        },
        valueWidthProportionClass:{
            type: String,
            default: 'col-xs-8 col-md-5'
        },
        labelBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-surface-800)' })
        },
        valueBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-surface-600)' })
        },
        textColor: {
            type: [String, Object],
            default: () => ({ color: 'var(--p-surface-50)' })
        },
        unitExtraStyleClass:{
            type: String,
            default: ''
        },
        defaultZeroUnit: {
            type: Number,
            default: null
        },
    },
    data() {
        const localData = {
            multiplier: null,
            scaledValue: null
        };

        const errorMessages = "";
        if (this.modelValue[this.name] == null &&
            this.defaultValue != null) {
            const aux = getMultiplier(this.defaultValue, 0.001);
            localData.scaledValue = removeTrailingZeroes(aux.scaledValue, this.numberDecimals);
            localData.multiplier = aux.multiplier;
        }

            if (this.modelValue[this.name] != null) {
            let aux;
            if (this.unit != null) {
                aux = getMultiplier(this.modelValue[this.name], 0.001);
                localData.scaledValue = removeTrailingZeroes(aux.scaledValue, this.numberDecimals);
            }
            else {
                localData.scaledValue = removeTrailingZeroes(this.modelValue[this.name], this.numberDecimals);
            }
            if (this.modelValue[this.name] == 0) {
                if (this.defaultZeroUnit != null) {
                    localData.multiplier = this.defaultZeroUnit;
                } else {
                    localData.multiplier = 1;
                }
            }
            else {
                if (this.unit != null) {
                    localData.multiplier = aux.multiplier;
                }
                else {
                    localData.multiplier = 1;
                }
            }
        }


        const shortenedName = this.name;

        return {
            localData,
            errorMessages,
            shortenedName,
        }
    },
    computed: {
    },
    watch: {
        forceUpdate(newValue, oldValue) {
            if (!isNaN(this.modelValue[this.name]))
                this.update(this.modelValue[this.name]);
        },
    },
    mounted () {    
        this.shortenedName = this.shortenName();
    },
    methods: {
        shortenName() {
            if (this.$refs.container == undefined)
                return this.name

            let shortenName = toTitleCase(this.name);
            if (this.$refs.container.clientWidth < 400 && this.name.length > 10) {
                let slice = 7;
                if (this.$refs.container.clientWidth < 310)
                    slice = 6;
                if (this.$refs.container.clientWidth < 250)
                    slice = 4;

                shortenName = shortenName.split(' ')
                    .map(item => item.length < slice? item + ' ' : item.slice(0, slice) + '. ')
                    .join('')
            }
            return shortenName
        },
        checkErrors() {
            let hasError = false;
            this.errorMessages = "";
            if (this.localData.scaledValue == null) {
                hasError = true;
                this.errorMessages += "Value must be set. Set it or remove the requirement from the menu.\n"
            }

            if (isNaN(this.localData.scaledValue)) {
                this.errorMessages += "Value cannot be empty.\n"
            }
            if (this.localData.scaledValue != null) {
                const nominalActualValue = this.localData.scaledValue * this.localData.multiplier;
                if ((nominalActualValue < 0 && !this.allowNegative) || (nominalActualValue == 0 && !this.allowZero)) {
                    hasError = true;
                    this.errorMessages += "Value must be greater or equal than 0.\n"
                }
            }
            return hasError;
        },
        update(actualValue) {
            if (this.max != null) {
                if (this.allowNegative){
                    if (Math.abs(actualValue) > this.max)
                        actualValue = this.max * Math.sign(actualValue);
                }
                else {
                    if (actualValue > this.max)
                        actualValue = this.max;
                }
            }
            if (this.min != null) {
                if (this.allowNegative) {
                    if (Math.abs(actualValue) < this.min)
                        actualValue = this.min * Math.sign(actualValue);
                }
                else {
                    if (this.allowZero) {
                        if (actualValue <= 0)
                            actualValue = 0;
                        else if (actualValue < this.min)
                            actualValue = this.min;
                    }
                    else {
                        if (actualValue < this.min)
                            actualValue = this.min;
                    }
                }
            }

            actualValue = Number(actualValue);

            if (this.$refs.inputRef != null) {
                if (this.unit != null) {
                    const aux = getMultiplier(actualValue, 0.001);
                    this.$refs.inputRef.value = removeTrailingZeroes(aux.scaledValue, this.numberDecimals)
                    this.localData.scaledValue = aux.scaledValue;
                    if (this.localData.scaledValue != 0) {
                        this.localData.multiplier = aux.multiplier;
                    } else if (this.defaultZeroUnit != null) {
                        this.localData.multiplier = this.defaultZeroUnit;
                    }
                }
                else {
                    this.$refs.inputRef.value = removeTrailingZeroes(actualValue, this.numberDecimals)
                    this.localData.scaledValue = removeTrailingZeroes(actualValue, this.numberDecimals);
                    this.localData.multiplier = 1;
                }
            }

            const hasError = this.checkErrors();
            if (!hasError) {
                this.modelValue[this.name] = actualValue;
                this.$emit("update", actualValue, this.name);
            }
        },
        changeMultiplier() {
            const actualValue = this.localData.scaledValue * this.localData.multiplier;
            this.update(actualValue);
        },
        changeScaledValue(value) {
            const actualValue = value * this.localData.multiplier / this.visualScale;
            this.update(actualValue);
        },
    }
}
</script>
<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex" ref="container">
        <div class="row align-items-center">
            <label
                :style="combinedStyle([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                v-if="replaceTitle == null"
                :data-cy="dataTestLabel + '-title'"
                :class="combinedClass([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                class="dim-label p-0"
            >
                {{shortenedName}}
            </label>
            <label
                :style="combinedStyle([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                v-if="replaceTitle != null && replaceTitle != ''"
                :data-cy="dataTestLabel + '-title'"
                :class="combinedClass([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                class="dim-label p-0"
            >
                {{replaceTitle}}
            </label>
            <div v-if="localData.scaledValue != null" class="row m-0 px-0 align-items-center" :class="(justifyContent? 'd-flex justify-content-end ' : '') + valueWidthProportionClass">
                <input type="number"
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    ref="inputRef"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-number-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-0' : '', unit == null && altUnit == null? 'col-12' : 'col-8'])"
                    class="dim-input m-0 pe-0 ps-1"
                    @change="changeScaledValue($event.target.value)"
                    :value="removeTrailingZeroes(localData.scaledValue * visualScale, numberDecimals)"
                >
                <DimensionUnit
                    v-if="unit != null"
                    v-model="localData.multiplier"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-DimensionUnit-input'"
                    :min="min"
                    :max="max"
                    :unit="unit"
                    :useMetricPrefixes="useMetricPrefixes"
                    :extraStyleClass="unitExtraStyleClass"
                    :valueBgColor="valueBgColor"
                    :valueFontSize="valueFontSize"
                    :textColor="textColor"
                    class="m-0 px-0 col-4"
                    @update:modelValue="changeMultiplier"/>
                <label
                    :style="combinedStyle([labelBgColor, textColor, valueFontSize, unitExtraStyleClass])"
                    v-if="unit == null && altUnit != ''"
                    class="px-2 pt-1 px-0"
                    :data-cy="dataTestLabel + '-DimensionUnit-text'"
                    :class="unit == null && justifyContent? 'col-0':'col-4'"
                >{{altUnit}}</label>
            </div>
        </div>
        <div class="row">
            <label :data-cy="dataTestLabel + '-error-text'" class="dim-error col-12 pt-1">{{errorMessages}}</label>
        </div>
    </div>
</template>

<style scoped>
.dim-label {
    border-radius: var(--p-border-radius);
    font-size: clamp(0.6rem, 2cqi, 0.875rem);
    overflow: hidden;
    white-space: nowrap;
    container-type: inline-size;
}

.dim-input {
    text-align: end;
    padding: 0.25rem 0 0.25rem 0.25rem;
    border: 1px solid var(--p-surface-400);
    border-radius: var(--p-border-radius) 0 0 var(--p-border-radius);
    border-right: none;
    font-family: var(--p-font-family);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    height: 1.75rem;
    line-height: 1.25rem;
}

.dim-input:focus {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 0 0.15rem color-mix(in srgb, var(--p-primary-color) 25%, transparent);
}

.dim-input:disabled {
    opacity: 0.6;
    cursor: default;
}

:deep(.unit-select) {
    border-radius: 0 var(--p-border-radius) var(--p-border-radius) 0;
    height: 1.75rem;
    line-height: 1.25rem;
}

.dim-error {
    text-align: center;
    color: var(--p-red-400);
    font-size: 0.9em;
    white-space: pre-wrap;
}
</style>
