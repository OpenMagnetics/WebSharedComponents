<script setup>
import { combinedStyle, combinedClass } from '../assets/js/utils.js'
</script>
<script>
export default {
    props: {
        unit:{
            type: String,
            required: true
        },
        modelValue:{
            type: Number,
            required: false
        },
        min:{
            type: Number,
            default: 1e-12
        },
        max:{
            type: Number,
            default: 1e+9
        },
        readOnly:{
            type: Boolean,
            default: false
        },
        extraStyleClass:{
            type: String,
            default: ''
        },
        useMetricPrefixes:{
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        valueFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        valueBgColor: {
            type: [String, Object],
            default: "bg-light",
        },
        textColor: {
            type: [String, Object],
            default: "text-white",
        },
    },
    data() {
        const multipliersLabel = {
        };

        if (this.min <= 1e-30 && this.max >= 1e-30) {
            if (this.useMetricPrefixes){
                multipliersLabel["q"] = 1e-30;
            }
            else {
                multipliersLabel["e-30"] = 1e-30;
            }
        }
        if (this.min <= 1e-27 && this.max >= 1e-27) {
            if (this.useMetricPrefixes){
                multipliersLabel["r"] = 1e-27;
            }
            else {
                multipliersLabel["e-27"] = 1e-27;
            }
        }
        if (this.min <= 1e-24 && this.max >= 1e-24) {
            if (this.useMetricPrefixes){
                multipliersLabel["y"] = 1e-24;
            }
            else {
                multipliersLabel["e-24"] = 1e-24;
            }
        }
        if (this.min <= 1e-21 && this.max >= 1e-21) {
            if (this.useMetricPrefixes){
                multipliersLabel["z"] = 1e-21;
            }
            else {
                multipliersLabel["e-21"] = 1e-21;
            }
        }
        if (this.min <= 1e-18 && this.max >= 1e-18) {
            if (this.useMetricPrefixes){
                multipliersLabel["a"] = 1e-18;
            }
            else {
                multipliersLabel["e-18"] = 1e-18;
            }
        }
        if (this.min <= 1e-15 && this.max >= 1e-15) {
            if (this.useMetricPrefixes){
                multipliersLabel["f"] = 1e-15;
            }
            else {
                multipliersLabel["e-15"] = 1e-15;
            }
        }
        if (this.min <= 1e-12 && this.max >= 1e-12) {
            if (this.useMetricPrefixes){
                multipliersLabel["p"] = 1e-12;
            }
            else {
                multipliersLabel["e-12"] = 1e-12;
            }
        }
        if (this.min <= 1e-9 && this.max >= 1e-9) {
            if (this.useMetricPrefixes){
                multipliersLabel["n"] = 1e-9;
            }
            else {
                multipliersLabel["e-9"] = 1e-9;
            }
        }
        if (this.min <= 1e-6 && this.max >= 1e-6) {
            if (this.useMetricPrefixes){
                multipliersLabel["u"] = 1e-6;
            }
            else {
                multipliersLabel["e-6"] = 1e-6;
            }
        }
        if (this.min <= 1e-3 && this.max >= 1e-3) {
            if (this.useMetricPrefixes){
                multipliersLabel["m"] = 1e-3;
            }
            else {
                multipliersLabel["e-3"] = 1e-3;
            }
        }
        if (this.min <= 1 && this.max >= 1) {
            if (this.useMetricPrefixes){
                multipliersLabel[""] = 1;
            }
            else {
                multipliersLabel["e-0"] = 1e-0;
            }
        }
        if (this.min <= 1e+3 && this.max >= 1e+3) {
            if (this.useMetricPrefixes){
                multipliersLabel["k"] = 1e+3;
            }
            else {
                multipliersLabel["e+3"] = 1e+3;
            }
        }
        if (this.min <= 1e+6 && this.max >= 1e+6) {
            if (this.useMetricPrefixes){
                multipliersLabel["M"] = 1e+6;
            }
            else {
                multipliersLabel["e+6"] = 1e+6;
            }
        }
        if (this.min <= 1e+9 && this.max >= 1e+9) {
            if (this.useMetricPrefixes){
                multipliersLabel["G"] = 1e+9;
            }
            else {
                multipliersLabel["e+9"] = 1e+9;
            }
        }

        return {
            multipliersLabel
        }
    },
    computed: {
        modelValueInRange() {
            if (!Object.values(this.multipliersLabel).includes(this.modelValue)) {
                var distance = 1e+12;
                var closest = this.modelValue;
                for (let [key, value] of Object.entries(this.multipliersLabel)) {
                    const thisDistance = Math.abs(value - this.modelValue);
                    if (distance > thisDistance) {
                        distance = thisDistance;
                        closest = value;
                    }
                }
                return closest;

            }
            else {
                return this.modelValue;
            }
        }
    },
    watch: { 
    },
    mounted () {
    },
    methods: {
    }
}
</script>


<template>
    <div>
        <select
            :style="combinedStyle([valueFontSize, extraStyleClass, valueBgColor, textColor])"
            class="form-select m-0 p-0 unit-select"
            :class="combinedClass([valueFontSize, extraStyleClass, valueBgColor, textColor, disabled? 'border-0':'', extraStyleClass==''? ' text-center p-1 ': ''])"
            :value="modelValueInRange"
            @change="$emit('update:modelValue', Number($event.target.value))"
            style="width:auto;"
            :disabled="readOnly || disabled">
            <option
                :style="combinedStyle([valueBgColor, valueFontSize])"
                v-for="value, label in multipliersLabel"
                :value="value"
                :class="combinedClass([valueBgColor, valueFontSize])"
            >
                {{label + unit}}
            </option>
        </select>
    </div>
</template>
<!-- 
<style type="text/css">
    .unit-select {
        background-image: none !important;
        background: none !important;
 }
</style> -->

