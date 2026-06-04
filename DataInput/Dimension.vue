<script setup>
import { toTitleCase, getMultiplier, removeTrailingZeroes } from '../assets/js/utils.js'
import DimensionUnit from './DimensionUnit.vue'
import InputNumber from 'primevue/inputnumber'
</script>
<script>
export default {
    components: { InputNumber },
    emits: ['update'],
    props: {
        name: { type: String, required: true },
        unit: { type: String, default: null, required: false },
        modelValue: { type: Object, required: true },
        defaultValue: { type: Number },
        min: { type: Number, default: 1e-12 },
        max: { type: Number, default: 1e+12 },
        unitMin: { type: Number, default: null },
        unitMax: { type: Number, default: null },
        numberDecimals: { type: Number, default: 6 },
        dataTestLabel: { type: String, default: '' },
        allowNegative: { type: Boolean, default: false },
        allowZero: { type: Boolean, default: false },
        altUnit: { type: String, default: null },
        visualScale: { type: Number, default: 1 },
        useMetricPrefixes: { type: Boolean, default: true },
        forceUpdate: { type: Number, default: 0 },
        replaceTitle: { type: String },
        tooltip: { type: String, default: null },
        justifyContent: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        valueFontSize: { type: [String, Object], default: () => ({ fontSize: '0.875rem' }) },
        labelFontSize: { type: [String, Object], default: () => ({ fontSize: '0.875rem' }) },
        labelWidthProportionClass: { type: String, default: '' },
        valueWidthProportionClass: { type: String, default: '' },
        labelBgColor: { type: [String, Object], default: () => ({}) },
        valueBgColor: { type: [String, Object], default: () => ({}) },
        textColor: { type: [String, Object], default: () => ({}) },
        unitExtraStyleClass: { type: String, default: '' },
        defaultZeroUnit: { type: Number, default: null },
    },
    data() {
        const localData = { multiplier: null, scaledValue: null }
        const errorMessages = ''
        const initial = this.modelValue[this.name]
        if (initial == null && this.defaultValue != null) {
            const aux = getMultiplier(this.defaultValue, 0.001)
            localData.scaledValue = removeTrailingZeroes(aux.scaledValue, this.numberDecimals)
            localData.multiplier = aux.multiplier
        }
        if (initial != null) {
            let aux
            if (this.unit != null) {
                aux = getMultiplier(initial, 0.001)
                localData.scaledValue = removeTrailingZeroes(aux.scaledValue, this.numberDecimals)
            } else {
                localData.scaledValue = removeTrailingZeroes(initial, this.numberDecimals)
            }
            if (initial === 0) {
                localData.multiplier = this.defaultZeroUnit != null ? this.defaultZeroUnit : 1
            } else {
                localData.multiplier = this.unit != null ? aux.multiplier : 1
            }
        }
        if (localData.multiplier != null) {
            if (this.unitMin != null && localData.multiplier < this.unitMin) {
                localData.multiplier = this.unitMin
                if (initial != null && this.unit != null) {
                    localData.scaledValue = removeTrailingZeroes(initial / localData.multiplier, this.numberDecimals)
                }
            }
            if (this.unitMax != null && localData.multiplier > this.unitMax) {
                localData.multiplier = this.unitMax
                if (initial != null && this.unit != null) {
                    localData.scaledValue = removeTrailingZeroes(initial / localData.multiplier, this.numberDecimals)
                }
            }
        }
        return {
            localData,
            errorMessages,
            shortenedName: this.name,
        }
    },
    watch: {
        forceUpdate() {
            if (!isNaN(this.modelValue[this.name])) this.update(this.modelValue[this.name])
        },
    },
    computed: {
        displayValue() {
            if (this.localData.scaledValue == null) return null
            return Number(removeTrailingZeroes(this.localData.scaledValue * this.visualScale, this.numberDecimals))
        },
    },
    mounted() {
        this.shortenedName = this.shortenName()
    },
    methods: {
        toTitleCase,
        shortenName() {
            if (this.$refs.container == undefined) return this.name
            let shortenName = toTitleCase(this.name)
            const w = this.$refs.container.clientWidth
            if (w < 400 && this.name.length > 10) {
                let slice = 7
                if (w < 310) slice = 6
                if (w < 250) slice = 4
                shortenName = shortenName.split(' ')
                    .map(item => item.length < slice ? item + ' ' : item.slice(0, slice) + '. ')
                    .join('')
            }
            return shortenName
        },
        checkErrors() {
            let hasError = false
            this.errorMessages = ''
            if (this.localData.scaledValue == null) {
                hasError = true
                this.errorMessages += 'Value must be set. Set it or remove the requirement from the menu.\n'
            }
            if (isNaN(this.localData.scaledValue)) {
                this.errorMessages += 'Value cannot be empty.\n'
            }
            if (this.localData.scaledValue != null) {
                const nominal = this.localData.scaledValue * this.localData.multiplier
                if ((nominal < 0 && !this.allowNegative) || (nominal === 0 && !this.allowZero)) {
                    hasError = true
                    this.errorMessages += 'Value must be greater or equal than 0.\n'
                }
            }
            return hasError
        },
        update(actualValue) {
            if (this.max != null) {
                if (this.allowNegative) {
                    if (Math.abs(actualValue) > this.max) actualValue = this.max * Math.sign(actualValue)
                } else if (actualValue > this.max) actualValue = this.max
            }
            if (this.min != null) {
                if (this.allowNegative) {
                    if (Math.abs(actualValue) < this.min) actualValue = this.min * Math.sign(actualValue)
                } else if (this.allowZero) {
                    if (actualValue <= 0) actualValue = 0
                    else if (actualValue < this.min) actualValue = this.min
                } else if (actualValue < this.min) actualValue = this.min
            }
            actualValue = Number(actualValue)
            if (this.unit != null) {
                const aux = getMultiplier(actualValue, 0.001)
                let mult = aux.multiplier
                let sv = aux.scaledValue
                if (this.unitMin != null && mult < this.unitMin) { mult = this.unitMin; sv = actualValue / mult }
                if (this.unitMax != null && mult > this.unitMax) { mult = this.unitMax; sv = actualValue / mult }
                this.localData.scaledValue = sv
                if (sv !== 0) this.localData.multiplier = mult
                else if (this.defaultZeroUnit != null) this.localData.multiplier = this.defaultZeroUnit
            } else {
                this.localData.scaledValue = removeTrailingZeroes(actualValue, this.numberDecimals)
                this.localData.multiplier = 1
            }
            const hasError = this.checkErrors()
            if (!hasError) {
                this.modelValue[this.name] = actualValue
                this.$emit('update', actualValue, this.name)
            }
        },
        changeMultiplier() {
            this.update(this.localData.scaledValue * this.localData.multiplier)
        },
        changeScaledValue(value) {
            this.update((Number(value) || 0) * this.localData.multiplier / this.visualScale)
        },
    },
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" class="dim-container" ref="container">
        <div class="dim-row">
            <label
                v-if="replaceTitle == null"
                :style="[labelFontSize, labelBgColor, textColor]"
                :class="labelWidthProportionClass"
                :data-cy="dataTestLabel + '-title'"
                class="dim-label"
                v-tooltip="tooltip">
                {{ shortenedName }}
            </label>
            <label
                v-else-if="replaceTitle !== ''"
                :style="[labelFontSize, labelBgColor, textColor]"
                :class="labelWidthProportionClass"
                :data-cy="dataTestLabel + '-title'"
                class="dim-label"
                v-tooltip="tooltip">
                {{ replaceTitle }}
            </label>
            <div v-if="localData.scaledValue != null"
                class="dim-value-row"
                :class="[justifyContent ? 'dim-value-row-end' : '', valueWidthProportionClass]">
                <InputNumber
                    :model-value="displayValue"
                    @update:model-value="changeScaledValue"
                    ref="inputRef"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-number-input'"
                    :max-fraction-digits="numberDecimals"
                    :allow-empty="false"
                    show-buttons
                    button-layout="stacked"
                    :class="['dim-input', unit == null && altUnit == null ? 'dim-input-full' : 'dim-input-with-unit']"
                />
                <DimensionUnit
                    v-if="unit != null"
                    v-model="localData.multiplier"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-DimensionUnit-input'"
                    :min="unitMin != null ? unitMin : min"
                    :max="unitMax != null ? unitMax : max"
                    :unit="unit"
                    :use-metric-prefixes="useMetricPrefixes"
                    :extra-style-class="unitExtraStyleClass"
                    :value-bg-color="valueBgColor"
                    :value-font-size="valueFontSize"
                    :text-color="textColor"
                    class="dim-unit"
                    @update:model-value="changeMultiplier"
                />
                <label
                    v-if="unit == null && altUnit != null && altUnit !== ''"
                    :style="[labelBgColor, textColor, valueFontSize]"
                    class="dim-alt-unit"
                    :data-cy="dataTestLabel + '-DimensionUnit-text'">
                    {{ altUnit }}
                </label>
            </div>
        </div>
        <div class="dim-error-row" v-if="errorMessages">
            <label :data-cy="dataTestLabel + '-error-text'" class="dim-error">{{ errorMessages }}</label>
        </div>
    </div>
</template>

<style scoped>
.dim-container:not([class*="col-"]) { width: 100%; }
.dim-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: nowrap;
    width: 100%;
    min-width: 0;
}
.dim-label {
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 0 1 auto;
    min-width: 0;
    padding: 0;
}
.dim-value-row {
    display: flex;
    align-items: center;
    gap: 0;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    min-width: 7rem;
    /* PrimeFlex .col-N applies padding: 0.5rem; cancel it so the inputs sit
       flush with the row baseline (label) instead of being pushed down. */
    padding: 0 !important;
}
.dim-value-row-end {
    justify-content: flex-end;
}
.dim-input {
    flex: 1 1 auto;
    min-width: 6.5rem; /* room for value text + stacked spinner buttons */
    display: flex;
    align-items: stretch;
}
.dim-input :deep(.p-inputnumber-input) {
    text-align: end;
    height: 1.75rem;
    /* Right padding leaves room for the absolutely-positioned spinner
       button column (1.5rem wide), so digits don't sit under the arrows. */
    padding: 0.25rem 1.75rem 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    width: 100%;
}
.dim-input :deep(.p-inputnumber-button) {
    height: 0.875rem;
    width: 1.25rem;
    padding: 0;
    font-size: 0.5rem;
}
.dim-input-full :deep(.p-inputnumber-input) {
    border-radius: var(--p-form-field-border-radius, 6px);
}
.dim-input-with-unit :deep(.p-inputnumber-input) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 0;
}
.dim-unit :deep(.p-select) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
/* PrimeFlex utility classes like .py-1/.pl-1 passed in via
   `unitExtraStyleClass` come with !important and beat single-class
   selectors. Use a 2-class compound selector to outrank them so the
   Select wrapper has no padding (its inner .p-select-label carries
   the visible padding instead). */
.dim-row .dim-unit {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}
.dim-row .dim-unit :deep(.p-select-label) {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-left: 0.5rem !important;
}
/* Fixed unit label (altUnit, e.g. ºC / % / years): render the same bordered box
   as the metric-prefix dropdown, just without the chevron, so single-unit fields
   match the multi-option ones. The adjacent input carries border-right:0, so this
   box's left border is the seam between them. */
.dim-alt-unit {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    align-self: stretch;
    height: 1.75rem;
    padding: 0 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    border: 1px solid var(--p-inputtext-border-color);
    background: var(--p-inputtext-background);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--p-form-field-border-radius, 6px);
    border-bottom-right-radius: var(--p-form-field-border-radius, 6px);
}
.dim-error-row {
    display: flex;
    width: 100%;
}
.dim-error {
    text-align: center;
    color: var(--p-red-400);
    font-size: 0.9em;
    white-space: pre-wrap;
    width: 100%;
    padding-top: 0.25rem;
}
</style>
