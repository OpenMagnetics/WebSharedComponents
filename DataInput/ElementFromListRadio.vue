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
            type: [Array, Object],
            required: true
        },
        dataTestLabel: {
            type: String,
            default: '',
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
        disabled: {
            type: Boolean,
            default: false,
        },
        optionsToDisable: {
            type: Array,
            default: [],
        },
        valueFontSize: {
            type: [String, Object],
            default: 'text-base'
        },
        labelFontSize: {
            type: [String, Object],
            default: 'text-base'
        },
        labelWidthProportionClass:{
            type: String,
            default: 'col-12 md:col-7'
        },
        valueWidthProportionClass:{
            type: String,
            default: 'col-4'
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
        },
        optionsIter() {
            if (Array.isArray(this.options)) {
                const aux = {}
                this.options.forEach((elem) => {
                    aux[elem] = elem;
                })
                return Object.entries(aux);
            }
            else {
                return Object.entries(this.options)
            }
        }
    },
    watch: { 
    },
    mounted () {
    },
    methods: {
        changedCheckedValue(checkedValue) {
            this.modelValue[this.name] = checkedValue;
            this.$emit("update", checkedValue, this.name);
        },
    }
}
</script>


<template>
    <div :data-cy="dataTestLabel + '-container'" class="grid">
        <div class="col-12 grid">
            <input 
                :style="combinedStyle([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-alt-title-label'"
                v-if="altText != null && !titleSameRow"
                type="text"
                :class="combinedClass([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                class="border-round p-0 mb-2 border-none"
                @change="$emit('changeText', $event.target.value)"
                :value="altText"
            >
            <label 
                :style="combinedStyle([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                v-if="altText == null && !titleSameRow"
                :class="combinedClass([labelFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                class="border-round p-0"
            >
                {{replaceTitle == null? toTitleCase(name) : toTitleCase(replaceTitle)}}
            </label>
        </div>
        <div class="col-12 grid">
            <label
                :style="combinedStyle([labelFontSize, labelWidthProportionClass, labelBgColor, textColor, labelWidthProportionClass])"
                :data-cy="dataTestLabel + '-same-row-label'"
                v-if="titleSameRow"
                :class="combinedClass([labelFontSize, labelWidthProportionClass, labelBgColor, textColor, labelWidthProportionClass])"
                class="border-round p-0"
            >
                {{replaceTitle == null? toTitleCase(name) : toTitleCase(replaceTitle)}}
            </label>
            <div
                :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, valueWidthProportionClass])"
                class="p-radio-container"
                :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, valueWidthProportionClass, disabled? 'border-none' : ''])"
                v-for="[key, value] in optionsIter"
            >
                <input
                    :disabled="optionsToDisable.includes(value)"
                    :data-cy="dataTestLabel + '-' + value + '-radio-input'"
                    :ref="key"
                    class="p-radio-input"
                    type="radio"
                    :checked="modelValue[name].includes(value)"
                    :id="key + '-radio-input'"
                    @change="changedCheckedValue(value)"
                >
                <label
                    v-if="key == 'Planar'"
                >
                &#128293;
                </label>
                <label
                    class="p-radio-label"
                    :for="key + '-radio-input'"
                >
                    {{key}}
                </label>

                <label
                    v-if="key == 'Planar'"
                >
                &#128293;
                </label>
            </div>
        </div>
    </div>
</template>

