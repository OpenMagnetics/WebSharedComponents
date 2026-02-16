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
            default: 'fs-6'
        },
        labelWidthProportionClass:{
            type: String,
            default: 'col-5'
        },
        valueWidthProportionClass:{
            type: String,
            default: 'col-7'
        },
        inputStyleClass:{
            type: String,
            default: 'col-7'
        },
        labelBgColor: {
            type: [String, Object],
            default: 'bg-dark'
        },
        valueBgColor: {
            type: [String, Object],
            default: 'bg-dark'
        },
        textColor: {
            type: [String, Object],
            default: 'text-white'
        },
        labelFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
    },
    data() {
        return {
            localData: {
                scaledValue: null,
                multiplier: 1,
            },
            title: "",
        }
    },
    computed: {
        shortenedName() {
            if (this.disableShortenLabels)
                return this.name;
            else if (this.name.length < 12)
                return this.name;
            else
                return this.name.slice(0, 9) + "...";
        },
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
    methods: {
        changeValue(event) {
        },
        update(actualValue) {
            if (this.unit != null) {
                const aux = getMultiplier(actualValue, 0.001, false, this.power)
                this.$refs.inputRef.value = removeTrailingZeroes(aux.scaledValue, this.numberDecimals)
                this.localData.scaledValue = aux.scaledValue;
                this.localData.multiplier = aux.multiplier;
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
    <div :data-cy="dataTestLabel + '-container'" class="container-flex" ref="container">
        <div class="row align-items-center ">
            <label
                v-if="replaceTitle == null"
                :style="combinedStyle([valueFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                class="rounded-2 pe-0 ps-0"
                :class="combinedClass([valueFontSize, labelWidthProportionClass, labelBgColor, textColor])"
            >
                {{shortenedName}}<sub>{{subscriptName}}</sub>
            </label>
            <label
                v-else
                :style="combinedStyle([valueFontSize, labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                class="rounded-2 pe-0 ps-0"
                :class="combinedClass([valueFontSize, labelWidthProportionClass, labelBgColor, textColor])"
            >
                {{replaceTitle}}<sub>{{subscriptName}}</sub>
            </label>
            <div v-show="localData.scaledValue != null" :class="valueWidthProportionClass" class="container m-0 px-0">
                <div class="row m-0 px-0 ">
                    <input 
                        :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                        :disabled="true"
                        :data-cy="dataTestLabel + '-number-label'"
                        type="number"
                        class="m-0 px-0 text-end border-0 col-8 pe-1"
                        :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                        :value="visuallyScaledValue"
                        ref="inputRef"
                    >
                    <DimensionUnit
                        v-if="unit != null"
                        v-model="localData.multiplier"
                        :disabled="true"
                        :readOnly="true"
                        :data-cy="dataTestLabel + '-DimensionUnit-input'"
                        :min="min"
                        :max="max"
                        :valueFontSize="valueFontSize"
                        :valueBgColor="labelBgColor"
                        :textColor="textColor"
                        :extraStyleClass="'text-start'"
                        :unit="unit"
                        class="m-0 py-0 px-0 col-4 border-0 "
                    />
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    /* display: none; <- Crashes Chrome on hover */
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

input[type=number] {
    -moz-appearance:textfield; /* Firefox */
    appearance: none;
}

input:focus {
    outline: none;
}

input {
    font-family: inherit;
    width: 100%;
    background: transparent;
    border: 0;
    margin: 0;
    padding: 0;
    color: inherit;
    text-align: right;
    cursor: default;
}

</style>
