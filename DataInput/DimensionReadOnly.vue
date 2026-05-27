<script setup>
import { toTitleCase, getMultiplier, removeTrailingZeroes, combinedStyle, combinedClass } from '../assets/js/utils.js'
import DimensionUnit from './DimensionUnit.vue'
</script>
<script>
export default {
    props: {
        name:{
            type: String,
            required: true
        },
        replaceTitle:{
            type: String,
            default: null,
        },
        tooltip:{
            type: String,
            default: null,
        },
        subscriptName:{
            type: String,
            default: ""
        },
        unit:{
            type: String,
            required: false
        },
        value:{
            default: 0
        },
        power:{
            type: Number,
            default: 1
        },
        min:{
            type: Number,
            default: 1e-12
        },
        max:{
            type: Number,
            default: 1e+9
        },
        unitMin:{
            type: Number,
            default: null
        },
        unitMax:{
            type: Number,
            default: null
        },
        numberDecimals:{
            type: Number,
            default: 6
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        altUnit:{
            type: String,
            default: ''
        },
        visualScale:{
            type: Number,
            default: 1
        },
        disableShortenLabels:{
            type: Boolean,
            default: false
        },
        useTitleCase:{
            type: Boolean,
            default: true
        },
        valueFontSize: {
            type: [String, Object],
            default: () => ({ fontSize: '0.875rem' })
        },
        labelWidthProportionClass:{
            type: String,
            default: ''
        },
        valueWidthProportionClass:{
            type: String,
            default: ''
        },
        inputStyleClass:{
            type: String,
            default: ''
        },
        labelBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'transparent' }),
        },
        valueBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-form-field-background, var(--bs-white))', border: '1px solid var(--p-form-field-border-color, #ced4da)' }),
        },
        textColor: {
            type: [String, Object],
            default: () => ({ color: 'var(--p-form-field-color, #333333)' }),
        },
    },
    data() {
        const localData = {
            multiplier: null,
            scaledValue: null
        };

        if (this.value != null) {
            let aux;
            if (this.unit != null) {
                aux = getMultiplier(Number(this.value), 0.001, false, this.power);
                localData.scaledValue = removeTrailingZeroes(aux.scaledValue, this.numberDecimals);
            }
            else {
                localData.scaledValue = removeTrailingZeroes(Number(this.value), this.numberDecimals);
            }
            if (this.value == 0) {
                localData.multiplier = 1;
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


        // Clamp multiplier to unitMin/unitMax if specified
        if (localData.multiplier != null) {
            if (this.unitMin != null && localData.multiplier < this.unitMin) {
                localData.multiplier = this.unitMin;
                if (this.value != null && this.unit != null) {
                    localData.scaledValue = removeTrailingZeroes(Number(this.value) / localData.multiplier, this.numberDecimals);
                }
            }
            if (this.unitMax != null && localData.multiplier > this.unitMax) {
                localData.multiplier = this.unitMax;
                if (this.value != null && this.unit != null) {
                    localData.scaledValue = removeTrailingZeroes(Number(this.value) / localData.multiplier, this.numberDecimals);
                }
            }
        }

        let shortenedName = this.name;

        return {
            localData,
            shortenedName,
        }
    },
    computed: {
        visuallyScaledValue() {
            const value = removeTrailingZeroes(Number(this.localData.scaledValue * this.visualScale), this.numberDecimals)
            return value;
        },
    },
    watch: {
        value(newValue, oldValue) {
            if (newValue != null)
                this.update(newValue);
        },
    },
    mounted () {
        this.shortenedName = this.shortenName();
    },
    methods: {
        shortenName() {
            if (this.$refs.container == undefined || this.disableShortenLabels)
                if (this.useTitleCase) {
                    return toTitleCase(this.name);
                }
                else {
                    return this.name;
                }

            let shortenName = this.name;
            if (this.useTitleCase) {
                shortenName = toTitleCase(this.name);
            }
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
        update(actualValue) {
            if (this.unit != null) {
                const aux = getMultiplier(actualValue, 0.001, false, this.power);
                let mult = aux.multiplier;
                let sv = aux.scaledValue;
                if (this.unitMin != null && mult < this.unitMin) { mult = this.unitMin; sv = actualValue / mult; }
                if (this.unitMax != null && mult > this.unitMax) { mult = this.unitMax; sv = actualValue / mult; }
                this.$refs.inputRef.value = removeTrailingZeroes(sv, this.numberDecimals)
                this.localData.scaledValue = sv;
                this.localData.multiplier = mult;
            }
            else {
                this.$refs.inputRef.value = removeTrailingZeroes(Number(actualValue), this.numberDecimals)
                this.localData.scaledValue = removeTrailingZeroes(Number(actualValue), this.numberDecimals);
                this.localData.multiplier = 1;
            }
        },
    }
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" class="dim-ro-container" ref="container">
        <div class="dim-ro-row">
            <label
                v-if="replaceTitle == null"
                :style="combinedStyle([valueFontSize, labelWidthProportionClass, textColor])"
                :data-cy="dataTestLabel + '-title'"
                class="dimension-readonly-label"
                :class="combinedClass([valueFontSize, labelWidthProportionClass, textColor])"
                v-tooltip="tooltip"
            >
                {{shortenedName}}<sub>{{subscriptName}}</sub>
            </label>
            <label
                v-else
                :style="combinedStyle([valueFontSize, labelWidthProportionClass, textColor])"
                :data-cy="dataTestLabel + '-title'"
                class="dimension-readonly-label"
                :class="combinedClass([valueFontSize, labelWidthProportionClass, textColor])"
                v-tooltip="tooltip"
            >
                {{replaceTitle}}<sub>{{subscriptName}}</sub>
            </label>
            <div v-show="localData.scaledValue != null" :class="valueWidthProportionClass" class="dim-ro-value-wrap">
                <div class="dim-ro-value-row">
                    <input
                        :style="combinedStyle([valueFontSize, textColor])"
                        :disabled="true"
                        :data-cy="dataTestLabel + '-number-label'"
                        type="number"
                        class="dim-ro-input"
                        :class="combinedClass([valueFontSize, textColor])"
                        :value="visuallyScaledValue"
                        ref="inputRef"
                    >
                    <DimensionUnit
                        v-if="unit != null"
                        v-model="localData.multiplier"
                        :disabled="true"
                        :readOnly="true"
                        :data-cy="dataTestLabel + '-DimensionUnit-input'"
                        :min="unitMin != null ? unitMin : min"
                        :max="unitMax != null ? unitMax : max"
                        :valueFontSize="valueFontSize"
                        :valueBgColor="null"
                        :textColor="textColor"
                        :extraStyleClass="''"
                        :unit="unit"
                        class="dim-ro-unit"
                    />
                    <label
                        :style="combinedStyle([textColor, valueFontSize])"
                        :data-cy="dataTestLabel + '-DimensionUnit-text'"
                        v-if="unit == null"
                        class="dim-ro-alt-unit"
                    >
                        {{altUnit}}
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped type="text/css">

/* Native number-input spinner arrows are intentionally left visible.
   A previous version hid them here via `::-webkit-inner-spin-button` and
   `-moz-appearance: textfield`, but those rules cannot be scoped by Vue
   (the pseudo-elements live in the browser's shadow DOM), so they
   leaked globally and stripped arrows from every editable number input
   in the host app. If you want a "clean" look in this component
   specifically, hide them on the local `.dim-input` class instead. */

.dim-ro-container:not([class*="col-"]) {
  width: 100%;
}

.dim-ro-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: nowrap;
  width: 100%;
  min-width: 0;
}

.dim-ro-value-wrap {
  flex: 1 1 auto;
  min-width: 0;
}

.dim-ro-value-row {
  display: flex;
  align-items: stretch;
  gap: 0;
  flex-wrap: nowrap;
  min-width: 0;
  width: 100%;
}

.dim-ro-input {
  flex: 1 1 auto;
  min-width: 0;
  text-align: end;
  padding: 0 0.25rem 0 0;
  border: 0;
  background-color: transparent !important;
}

.dim-ro-unit {
  flex: 0 0 auto;
  border: 0 !important;
  background-color: transparent !important;
}

.dim-ro-unit :deep(select),
.dim-ro-unit :deep(input) {
  background-color: transparent !important;
}

.dimension-readonly-label {
  background-color: transparent !important;
}

.dim-ro-alt-unit {
  background-color: transparent !important;
}

.dim-ro-alt-unit {
  margin-left: 0.5rem;
  padding-top: 0.25rem;
}

.dimension-readonly-label {
  border-radius: var(--p-border-radius);
  font-size: 0.875rem;
  overflow: hidden;
  white-space: nowrap;
  flex: 0 0 auto;
  padding: 0;
}

.text-danger {
  color: var(--p-red-400);
}

input {
  border-radius: var(--p-border-radius);
  color: var(--p-form-field-color, #333333);
  background-color: var(--p-form-field-background, var(--bs-white));
  border: 1px solid var(--p-form-field-border-color, #ced4da);
  font-family: var(--p-font-family);
}

</style>


