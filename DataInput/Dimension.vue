<script setup>
import { toTitleCase, getMultiplier, removeTrailingZeroes } from '/WebSharedComponents/assets/js/utils.js'
import DimensionUnit from '/WebSharedComponents/DataInput/DimensionUnit.vue'
import InputNumber from 'primevue/inputnumber'
</script>
<script>
export default {
    components: { InputNumber },
    emits: ['update'],
    props: {
        // --- Binding ---
        modelValue: { type: Object, required: true },
        name: { type: String, required: true },
        defaultValue: { type: Number },
        // Bump to force the component to re-read modelValue[name] after an
        // external change (the cached scaled value does not react on its own).
        forceUpdate: { type: Number, default: 0 },

        // --- Label ---
        // null -> Title-Cased name; '' -> no label; any other string -> that text.
        replaceTitle: { type: String },
        tooltip: { type: String, default: null },
        dataTestLabel: { type: String, default: '' },

        // --- Unit ---
        unit: { type: String, default: null },
        altUnit: { type: String, default: null },
        unitMin: { type: Number, default: null },
        unitMax: { type: Number, default: null },
        useMetricPrefixes: { type: Boolean, default: true },
        defaultZeroUnit: { type: Number, default: null },

        // --- Value constraints ---
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        visualScale: { type: Number, default: 1 },

        // --- State ---
        disabled: { type: Boolean, default: false },
        showButtons: { type: Boolean, default: true },
        optional: { type: Boolean, default: false },
    },
    data() {
        const localData = { multiplier: null, scaledValue: null }
        const errorMessages = ''
        const initial = this.modelValue[this.name]
        if (initial == null && this.defaultValue != null) {
            const aux = getMultiplier(this.defaultValue, 0.001)
            localData.scaledValue = removeTrailingZeroes(aux.scaledValue, 6)
            localData.multiplier = aux.multiplier
        }
        if (initial != null) {
            let aux
            if (this.unit != null) {
                aux = getMultiplier(initial, 0.001)
                localData.scaledValue = removeTrailingZeroes(aux.scaledValue, 6)
            } else {
                localData.scaledValue = removeTrailingZeroes(initial, 6)
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
                    localData.scaledValue = removeTrailingZeroes(initial / localData.multiplier, 6)
                }
            }
            if (this.unitMax != null && localData.multiplier > this.unitMax) {
                localData.multiplier = this.unitMax
                if (initial != null && this.unit != null) {
                    localData.scaledValue = removeTrailingZeroes(initial / localData.multiplier, 6)
                }
            }
        }
        if (this.optional && localData.multiplier == null) {
            let mult = this.defaultZeroUnit != null ? this.defaultZeroUnit : 1
            if (this.unitMin != null && mult < this.unitMin) mult = this.unitMin
            if (this.unitMax != null && mult > this.unitMax) mult = this.unitMax
            localData.multiplier = mult
        }
        return {
            localData,
            errorMessages,
            shortenedName: this.name,
            inputKey: 0,
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
            return Number(removeTrailingZeroes(this.localData.scaledValue * this.visualScale, 6))
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
            this.errorMessages = ''
            if (this.optional && this.localData.scaledValue == null) return false
            if (this.localData.scaledValue == null) {
                this.errorMessages = 'Value must be set.'
                return true
            }
            return false
        },
        update(actualValue) {
            if (this.optional && (actualValue === null || actualValue === undefined
                || actualValue === '' || Number.isNaN(Number(actualValue)))) {
                this.localData.scaledValue = null
                this.errorMessages = ''
                this.modelValue[this.name] = null
                this.$emit('update', null, this.name)
                return
            }
            actualValue = Number(actualValue)
            if (this.max != null && actualValue > this.max) actualValue = this.max
            if (this.min != null && actualValue < this.min) actualValue = this.min
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
                this.localData.scaledValue = removeTrailingZeroes(actualValue, 6)
                this.localData.multiplier = 1
            }
            const hasError = this.checkErrors()
            if (!hasError) {
                this.modelValue[this.name] = actualValue
                this.$emit('update', actualValue, this.name)
            }
        },
        changeMultiplier(newMultiplier) {
            // Changing the unit on an empty optional field must not materialise a value.
            if (this.optional && this.localData.scaledValue == null) {
                this.localData.multiplier = newMultiplier
                return
            }
            // Keep the displayed number unchanged; only the unit changes so the
            // stored SI value changes (e.g. 5 displayed with M selected → switch
            // to k → still displays 5 but stores 5 kΩ = 5000 Ω, not 5000 kΩ).
            // Auto-scaling (1000 → 1k) only happens when the user types a value,
            // not when they manually pick a different prefix.
            const newActualValue = (this.localData.scaledValue ?? 0) * newMultiplier
            this.localData.multiplier = newMultiplier
            this.modelValue[this.name] = newActualValue
            this.$emit('update', newActualValue, this.name)
        },
        changeScaledValue(value) {
            // Collapse back-to-back emissions from PrimeVue InputNumber (keydown
            // + blur can both fire for a single commit). The setTimeout(0) lock
            // outlives both emission timings while clearing before the next keystroke.
            if (this._changeScaledValueLock) return
            this._changeScaledValueLock = true
            setTimeout(() => { this._changeScaledValueLock = false }, 0)
            if (this.optional && (value === null || value === undefined || value === '')) {
                this.update(null)
                return
            }
            const prevScaled = this.localData.scaledValue
            const prevMult = this.localData.multiplier
            this.update((Number(value) || 0) * this.localData.multiplier / this.visualScale)
            // If update() left both scaledValue and multiplier unchanged (e.g. the
            // typed value was clamped to the same min/max already stored), Vue sees
            // no reactive diff on displayValue and the InputNumber keeps showing the
            // invalid typed text. Bump inputKey to force a remount with the correct value.
            if (this.localData.scaledValue === prevScaled && this.localData.multiplier === prevMult) {
                this.inputKey++
            }
        },
    },
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" class="dim-container" ref="container">
        <div class="dim-row">
            <label
                v-if="replaceTitle == null"
                :data-cy="dataTestLabel + '-title'"
                class="dim-label"
                v-tooltip="tooltip">
                {{ shortenedName }}
            </label>
            <label
                v-else-if="replaceTitle !== ''"
                :data-cy="dataTestLabel + '-title'"
                class="dim-label"
                v-tooltip="tooltip">
                {{ replaceTitle }}
            </label>
            <div v-if="optional || localData.scaledValue != null"
                class="dim-value-row"
                :class="(unit != null || (altUnit != null && altUnit !== '')) ? 'dim-value-row-has-unit' : 'dim-value-row-no-unit'">
                <InputNumber
                    :key="`${localData.multiplier}-${inputKey}`"
                    :model-value="displayValue"
                    @update:model-value="changeScaledValue"
                    ref="inputRef"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-number-input'"
                    :max-fraction-digits="6"
                    :allow-empty="optional"
                    :placeholder="optional ? '—' : undefined"
                    :show-buttons="showButtons"
                    button-layout="stacked"
                    :class="['dim-input', unit == null && altUnit == null ? 'dim-input-full' : 'dim-input-with-unit', showButtons ? '' : 'dim-input-no-buttons']"
                />
                <DimensionUnit
                    v-if="unit != null"
                    :model-value="localData.multiplier"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-DimensionUnit-input'"
                    :min="unitMin != null ? unitMin : min"
                    :max="unitMax != null ? unitMax : max"
                    :unit="unit"
                    :use-metric-prefixes="useMetricPrefixes"
                    class="dim-unit"
                    @update:model-value="changeMultiplier"
                />
                <label
                    v-if="unit == null && altUnit != null && altUnit !== ''"
                    class="dim-alt-unit"
                    :class="{ 'dim-alt-unit--disabled': disabled }"
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

/* ── outer row: label + value area ──────────────────────────────── */
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
    flex: 0 1 9rem;
    min-width: 0;
    padding: 0;
}

/* ── value + unit flex container ─────────────────────────────────── */
/* overflow:hidden here is the safety net: if any child still tries  */
/* to exceed its share, it is clipped at this boundary instead of    */
/* visually pushing the unit column out of view.                     */
.dim-value-row {
    display: flex;
    align-items: stretch;
    gap: 0;
    flex: 1 1 0;
    min-width: 0;
    padding: 0 !important;
    overflow: hidden;
}

/* No-unit: input fills everything */
.dim-value-row-no-unit  .dim-input { flex: 1 1 0; }

/* Has-unit: input gets 3 parts, unit gets 1 part (min 2.5 rem, no shrink) */
.dim-value-row-has-unit .dim-input          { flex: 4 1 0; }
.dim-value-row-has-unit .dim-unit,
.dim-value-row-has-unit .dim-alt-unit       { flex: 1 0 2.5rem; min-width: 2.5rem; }

/* ── input wrapper ───────────────────────────────────────────────── */
/* overflow:hidden forces the PrimeVue span to stay within its flex  */
/* share even when the browser's default <input> min-width fights it. */
.dim-input {
    min-width: 0;
    overflow: hidden;
    display: flex;
    align-items: stretch;
}
.dim-input :deep(.p-inputnumber) {
    min-width: 0 !important;
    width: 100%;
    overflow: hidden;
}
.dim-input :deep(.p-inputnumber-input) {
    text-align: end;
    height: 1.75rem;
    padding: 0.25rem 1.75rem 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    width: 100%;
    min-width: 0 !important;
}
.dim-input-no-buttons :deep(.p-inputnumber-input) { padding-right: 0.5rem; }
.dim-input :deep(.p-inputnumber-button) {
    height: 0.875rem;
    width: 1.25rem;
    padding: 0;
    font-size: 0.5rem;
}
.dim-input :deep(.p-inputnumber-button-group) {
    opacity: 0;
    transition: opacity 0.12s ease;
}
.dim-input:hover :deep(.p-inputnumber-button-group),
.dim-input:focus-within :deep(.p-inputnumber-button-group) { opacity: 1; }
.dim-input-full :deep(.p-inputnumber-input) {
    border-radius: var(--p-form-field-border-radius, 6px);
}
.dim-input-with-unit :deep(.p-inputnumber-input) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 0;
}

/* ── unit dropdown (DimensionUnit / Select) ──────────────────────── */
.dim-unit {
    min-width: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
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

/* ── static alt-unit label (e.g. "%" "°C") ──────────────────────── */
.dim-alt-unit {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-width: 0;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.dim-alt-unit--disabled {
    background: var(--p-select-disabled-background);
    color: var(--p-select-disabled-color);
}

/* ── error row ───────────────────────────────────────────────────── */
.dim-error-row { display: flex; width: 100%; }
.dim-error {
    text-align: center;
    color: var(--p-red-400);
    font-size: 0.9em;
    white-space: pre-wrap;
    width: 100%;
    padding-top: 0.25rem;
}
</style>
