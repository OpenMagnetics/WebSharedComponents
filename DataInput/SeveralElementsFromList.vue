<script setup>
import { toTitleCase, getMultiplier, combinedStyle, combinedClass } from '../assets/js/utils.js'

</script>
<script>
export default {
    props: {
        name:{
            type: String,
            required: true
        },
        modelValue:{
            type: Object,
            required: true
        },
        options:{
            type: Object,
            required: true
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        optionsToDisable: {
            type: Array,
            default: () => [],
        },
        classInput: {
            type: String,
            default: 'col-lg-6 col-xl-2',
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
        labelBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'transparent' }),
        },
        valueBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--bs-white, var(--bs-white))', border: '1px solid var(--bs-border-color, #ced4da)' }),
        },
        textColor: {
            type: [String, Object],
            default: () => ({ color: 'var(--bs-body-color, #333333)' }),
        },
    },
    data() {
        return {
        }
    },
    computed: {
        selectedLabel() {
        }
    },
    watch: { 
    },
    mounted () {
    },
    methods: {
        changedCheckedValue(checkedValue) {
            let found = false;
            const newList = [];
            for (let [key, value] of Object.entries(this.modelValue[this.name])) {
                if (value == checkedValue) {
                    found = true;
                }
                else {
                    newList.push(value);
                }
        
            }
            if (!found) {
                this.modelValue[this.name].push(checkedValue);
            }
            else {
                this.modelValue[this.name] = newList;
            }
            this.$emit("update", checkedValue, this.name);
        },
    }
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex">
        <div class="d-flex flex-wrap align-items-center justify-content-between" :class="justifyContent? 'text-left ml-0 pl-0' : 'm-0 pl-3'" style="gap: 0.5rem 1rem;">
            <label
                :style="combinedStyle([labelBgColor, textColor, labelFontSize])"
                :data-cy="dataTestLabel + '-title'"
                class="several-elements-label me-2"
                :class="combinedClass([labelBgColor, textColor, labelFontSize])"
            >
                {{toTitleCase(name)}}
            </label>
            <div :class="classInput" class="form-check m-0" v-for="[key, value] in Object.entries(options)" :key="key">
                <input
                    :style="combinedStyle([textColor])"
                    :disabled="optionsToDisable.includes(value) || disabled"
                    :data-cy="dataTestLabel + '-' + value + '-checkbox-input'"
                    :ref="key"
                    class="form-check-input border"
                    type="checkbox"
                    :checked="modelValue[name].includes(value)"
                    :id="name + '-checkbox-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-0' : ''])"
                    @change="changedCheckedValue(value)"
                >
                <label 
                    :style="combinedStyle([labelBgColor, textColor, valueFontSize])"
                    class="form-check-label"
                    :class="combinedClass([labelBgColor, textColor, valueFontSize])"
                    :for="name + '-checkbox-input'">
                    {{value}}
                </label>
            </div>
        </div>
    </div>
</template>

<style scoped>
.several-elements-label {
    font-size: 0.875rem;
    overflow: hidden;
    white-space: nowrap;
    border-radius: var(--p-border-radius);
}
</style>
