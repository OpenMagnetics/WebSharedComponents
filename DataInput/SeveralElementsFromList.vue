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
            default: [],
        },
        classInput: {
            type: String,
            default: 'lg:col-6 xl:col-2',
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
            default: 'text-base'
        },
        labelFontSize: {
            type: [String, Object],
            default: 'text-base'
        },
        labelBgColor: {
            type: [String, Object],
            default: "surface-900",
        },
        valueBgColor: {
            type: [String, Object],
            default: "surface-100",
        },
        textColor: {
            type: [String, Object],
            default: "text-white",
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
    <div :data-cy="dataTestLabel + '-container'" class="grid ">
        <div class="col-12 grid" :class="justifyContent? 'text-left ml-0 pl-0' : 'm-0 pl-3'">
            <label
                :style="combinedStyle([labelBgColor, textColor, labelFontSize])"
                :data-cy="dataTestLabel + '-title'"
                class="border-round "
                :class="combinedClass([labelBgColor, textColor, labelFontSize])"
            >
                {{toTitleCase(name)}}
            </label>
        <div class="col-12 grid">
        </div>
            <div :class="classInput" class="p-checkbox-container ml-4 " v-for="[key, value] in Object.entries(options)" :key="key">
                <input
                    :style="combinedStyle([textColor])"
                    :disabled="optionsToDisable.includes(value) || disabled"
                    :data-cy="dataTestLabel + '-' + value + '-checkbox-input'"
                    :ref="key"
                    class="p-checkbox-input surface-transparent border-1"
                    type="checkbox"
                    :checked="modelValue[name].includes(value)"
                    :id="name + '-checkbox-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-none' : ''])"
                    @change="changedCheckedValue(value)"
                >
                <label 
                    :style="combinedStyle([labelBgColor, textColor, valueFontSize])"
                    class="p-checkbox-label"
                    :class="combinedClass([labelBgColor, textColor, valueFontSize])"
                    :for="name + '-checkbox-input'">
                    {{value}}
                </label>
            </div>
        </div>
    </div>
</template>

<style>
</style>
