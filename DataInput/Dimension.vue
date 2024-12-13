<script setup>
import { toTitleCase, getMultiplier, removeTrailingZeroes } from '../assets/js/utils.js'
import DimensionUnit from './DimensionUnit.vue'
</script>
<script>
export default {
    props: {
        name:{
            type: String,
            required: true
        },
        unit:{
            type: String,
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
            default: ''
        },
        visualScale:{
            type: Number,
            default: 1
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
        styleClass:{
            type: String,
            default: 'fs-5'
        },
        styleClassInput: {
            type: String,
            default: "m-0 px-0 col-6",
        },
        labelStyleClass:{
            type: String,
            default: 'col-xs-12 col-md-7'
        },
        dimensionStyleClass:{
            type: String,
            default: 'col-xs-8 col-md-5'
        },
        labelBgColor: {
            type: String,
            default: "bg-dark",
        },
        inputBgColor: {
            type: String,
            default: "bg-light",
        },
        textColor: {
            type: String,
            default: "text-white",
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
            const aux = getMultiplier(this.modelValue[this.name], 0.001);
            localData.scaledValue = removeTrailingZeroes(aux.scaledValue, this.numberDecimals);
            if (this.modelValue[this.name] == 0) {
                localData.multiplier = this.max;
            }
            else {
                localData.multiplier = aux.multiplier;
            }
        }

        var shortenedName = this.name;

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

            var shortenName = toTitleCase(this.name);
            if (this.$refs.container.clientWidth < 400 && this.name.length > 10) {
                var slice = 7;
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
            var hasError = false;
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
                        if (actualValue < 0)
                            actualValue = 0;
                    }
                    else {
                        if (actualValue < this.min)
                            actualValue = this.min;
                    }
                }
            }

            actualValue = Number(actualValue);

            if (this.unit != null) {
                const aux = getMultiplier(actualValue, 0.001);
                this.$refs.inputRef.value = removeTrailingZeroes(aux.scaledValue, this.numberDecimals)
                this.localData.scaledValue = aux.scaledValue;
                this.localData.multiplier = aux.multiplier;
            }
            else {
                this.$refs.inputRef.value = removeTrailingZeroes(actualValue, this.numberDecimals)
                this.localData.scaledValue = removeTrailingZeroes(actualValue, this.numberDecimals);
                this.localData.multiplier = 1;
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
        <div class="row">
            <label v-if="replaceTitle == null" :data-cy="dataTestLabel + '-title'" :class="styleClass + ' ' + labelStyleClass + ' ' + labelBgColor + ' ' + textColor" class="rounded-2 ">{{shortenedName}}</label>
            <label v-if="replaceTitle != null && replaceTitle != ''"  :data-cy="dataTestLabel + '-title'" :class="styleClass + ' ' + labelStyleClass" class="rounded-2">{{replaceTitle}}</label>
            <div v-if="localData.scaledValue != null" class="row m-0 px-0" :class="justifyContent? 'd-flex justify-content-end ' + dimensionStyleClass : dimensionStyleClass">
                <input :disabled="disabled" :data-cy="dataTestLabel + '-number-input'" type="number" :class="styleClassInput + ' ' + inputBgColor + ' ' + textColor" class="" @change="changeScaledValue($event.target.value)" :value="removeTrailingZeroes(localData.scaledValue * visualScale, numberDecimals)" ref="inputRef">
                <DimensionUnit
                    v-if="unit != null"
                    v-model="localData.multiplier"
                    :disabled="disabled"
                    :data-cy="dataTestLabel + '-DimensionUnit-input'"
                    :min="min"
                    :max="max"
                    :unit="unit"
                    :inputBgColor="inputBgColor"
                    :textColor="textColor"
                    class="m-0 px-0 col-4"
                    @update:modelValue="changeMultiplier"/>
                <label
                    v-if="unit == null" class="px-2 pt-1 px-0 "
                    :data-cy="dataTestLabel + '-DimensionUnit-text'"
                    :class="unit == null && justifyContent? 'col-0':'col-4'"
                >{{altUnit}}</label>
            </div>
        </div>
        <div class="row">
            <label :data-cy="dataTestLabel + '-error-text'" class="text-danger text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>


