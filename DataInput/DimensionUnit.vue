<script setup>
import Select from 'primevue/select'
</script>
<script>
export default {
    components: { Select },
    inheritAttrs: false,
    props: {
        unit: { type: String, required: true },
        modelValue: { type: Number, required: false },
        min: { type: Number, default: 1e-12 },
        max: { type: Number, default: 1e+9 },
        readOnly: { type: Boolean, default: false },
        extraStyleClass: { type: String, default: '' },
        useMetricPrefixes: { type: Boolean, default: true },
        disabled: { type: Boolean, default: false },
        valueFontSize: { type: [String, Object], default: () => ({ fontSize: '0.875rem' }) },
        valueBgColor: { type: [String, Object], default: () => ({}) },
        textColor: { type: [String, Object], default: () => ({}) },
    },
    emits: ['update:modelValue'],
    computed: {
        multiplierEntries() {
            const ranges = [
                { exp: -30, sym: 'q' }, { exp: -27, sym: 'r' }, { exp: -24, sym: 'y' },
                { exp: -21, sym: 'z' }, { exp: -18, sym: 'a' }, { exp: -15, sym: 'f' },
                { exp: -12, sym: 'p' }, { exp: -9,  sym: 'n' }, { exp: -6,  sym: 'u' },
                { exp: -3,  sym: 'm' }, { exp: 0,   sym: ''  }, { exp: 3,   sym: 'k' },
                { exp: 6,   sym: 'M' }, { exp: 9,   sym: 'G' },
            ]
            const out = []
            for (const r of ranges) {
                const v = Math.pow(10, r.exp)
                if (v < this.min || v > this.max) continue
                const label = this.useMetricPrefixes ? r.sym : (r.exp >= 0 ? `e+${r.exp}` : `e${r.exp}`)
                out.push({ label: label + this.unit, value: v })
            }
            return out
        },
        modelValueInRange() {
            const values = this.multiplierEntries.map(e => e.value)
            if (values.includes(this.modelValue)) return this.modelValue
            let best = this.modelValue, bestD = Infinity
            for (const v of values) {
                const d = Math.abs(v - this.modelValue)
                if (d < bestD) { bestD = d; best = v }
            }
            return best
        },
    },
}
</script>

<template>
    <Select
        v-bind="$attrs"
        class="unit-select"
        :class="[extraStyleClass, extraStyleClass === '' ? 'unit-select-centered' : '']"
        :options="multiplierEntries"
        option-label="label"
        option-value="value"
        :model-value="modelValueInRange"
        @update:model-value="$emit('update:modelValue', Number($event))"
        :disabled="readOnly || disabled"
    />
</template>

<style scoped>
.unit-select {
    height: 1.75rem;
    line-height: 1.25rem;
    font-size: 0.875rem;
    padding: 0 !important;
}
.unit-select-centered :deep(.p-select-label) {
    text-align: center;
}
.unit-select :deep(.p-select-label) {
    padding: 0.25rem 0.5rem;
    line-height: 1.25rem;
    font-size: 0.875rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
.unit-select :deep(.p-select-dropdown) {
    width: 1.5rem;
}
/* When the unit Select is read-only / disabled (used by
   DimensionReadOnly), hide the dropdown chevron and drop the
   border-box appearance so it reads as static text. */
.unit-select.p-disabled,
.unit-select[aria-disabled="true"] {
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    opacity: 1 !important;
}
.unit-select.p-disabled :deep(.p-select-dropdown),
.unit-select[aria-disabled="true"] :deep(.p-select-dropdown) {
    display: none;
}
.unit-select.p-disabled :deep(.p-select-label),
.unit-select[aria-disabled="true"] :deep(.p-select-label) {
    padding-right: 0.5rem;
}
</style>
