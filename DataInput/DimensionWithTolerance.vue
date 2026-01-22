<script setup>
import { toTitleCase, getMultiplier, combinedStyle, combinedClass } from '../assets/js/utils.js'
import DimensionUnit from './DimensionUnit.vue'
import { tooltipsMagneticSynthesisDesignRequirements } from '../assets/js/texts.js'
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
        defaultField:{
            type: String,
            default: "nominal"
        },
        defaultValue:{
            type: Object,
            default: {}
        },
        halfSize:{
            type: Boolean,
            default: false    
        },
        severalRows:{
            type: Boolean,
            default: false    
        },
        varText:{
            type: Boolean,
            default: false    
        },
        min:{
            type: Number,
            default: 1e-12
        },
        max:{
            type: Number,
            default: 1e+9
        },
        disabledScaling: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        allowNegative:{
            type: Boolean,
            default: false
        },
        allowAllNull:{
            type: Boolean,
            default: false
        },
        allowUnsorted:{
            type: Boolean,
            default: false
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        addButtonStyle: {
            type: Object,
            default: {},
        },
        removeButtonBgColor: {
            type: String,
            default: "surface-danger",
        },
        valueFontSize: {
            type: [String, Object],
            default: 'text-base'
        },
        titleFontSize: {
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
        unitExtraStyleClass:{
            type: String,
            default: ''
        },
    },
    data() {
        const localData = {
            minimum: {
                multiplier: null,
                scaledValue: null
            },
            nominal: {
                multiplier: null,
                scaledValue: null
            },
            maximum: {
                multiplier: null,
                scaledValue: null
            },
        };

        const buttonLabels = {
            minimum: "Add minimum",
            nominal: "Add nominal",
            maximum: "Add maximum",
        };

        const errorMessages = "";
        if (this.modelValue.minimum == null &&
            this.modelValue.nominal == null &&
            this.modelValue.maximum == null &&
            this.defaultField != null &&
            this.defaultValue != null) {
            const aux = getMultiplier(this.defaultValue[this.defaultField], 0.001, this.disabledScaling);
            localData[this.defaultField].scaledValue = aux.scaledValue;
            localData[this.defaultField].multiplier = aux.multiplier;
        }

        if (this.modelValue.minimum != null) {
            const aux = getMultiplier(this.modelValue.minimum, 0.001, this.disabledScaling);
            localData.minimum.scaledValue = aux.scaledValue;
            localData.minimum.multiplier = aux.multiplier;
        }
        if (this.modelValue.nominal != null) {
            const aux = getMultiplier(this.modelValue.nominal, 0.001, this.disabledScaling);
            localData.nominal.scaledValue = aux.scaledValue;
            localData.nominal.multiplier = aux.multiplier;
        }
        if (this.modelValue.maximum != null) {
            const aux = getMultiplier(this.modelValue.maximum, 0.001, this.disabledScaling);
            localData.maximum.scaledValue = aux.scaledValue;
            localData.maximum.multiplier = aux.multiplier;
        }

        return {
            localData,
            buttonLabels,
            errorMessages,
        }
    },
    computed: {
        shortenedButtonLabels() {
            const shortenedButtonLabels = {}
            for (let [key, value] of Object.entries(this.buttonLabels)) {
                let label = value;
                if (window.innerWidth > 768 && window.innerWidth < 1005 && !this.halfSize ||
                    window.innerWidth > 768 && window.innerWidth < 2000 && this.halfSize) {
                    let slice = 3;

                    if (window.innerWidth < 1500 && this.halfSize){
                        slice = 2;
                    }

                    label = label.split(' ')
                        .map(item => (item.length <= slice)? item + ' ' : item.slice(0, slice) + '. ')
                        .join('')
                    // label = label.slice(0, slice) + '.'
                }
                shortenedButtonLabels[key] = label;
            }
            return shortenedButtonLabels
        },
        styleTooltip() {
            const relative_placement = 'top';
            return {
                theme: {
                    placement: relative_placement,
                    width: '400px',
                    "text-align": "start",
                },
            }
        },
    },
    watch: { 
    },
    mounted () {
        this.checkErrors();
    },
    methods: {
        checkErrors() {
            let hasError = false;
            this.errorMessages = "";
            if (this.localData.minimum.scaledValue == null && this.localData.nominal.scaledValue == null && this.localData.maximum.scaledValue == null && !this.allowAllNull) {
                hasError = true;
                this.errorMessages += "At least one value must be set. Set one or remove the requirement from the menu.\n"
            }
            if (isNaN(this.localData.nominal.scaledValue)) {
                this.errorMessages += "Nominal value cannot be empty.\n"
            }
            if (isNaN(this.localData.minimum.scaledValue)) {
                this.errorMessages += "Minimum value cannot be empty.\n"
            }
            if (isNaN(this.localData.maximum.scaledValue)) {
                this.errorMessages += "Maximum value cannot be empty.\n"
            }
            if (this.localData.nominal.scaledValue != null) {
                const nominalActualValue = this.localData.nominal.scaledValue * this.localData.nominal.multiplier;
                if (nominalActualValue <= 0 && !this.allowNegative) {
                    hasError = true;
                    this.errorMessages += "Nominal value must be greater than 0.\n"
                }
            }
            if (this.localData.minimum.scaledValue != null) {
                const minimumActualValue = this.localData.minimum.scaledValue * this.localData.minimum.multiplier;
                if (minimumActualValue <= 0 && !this.allowNegative) {
                    hasError = true;
                    this.errorMessages += "Minimum value must be greater than 0.\n"
                }
            }
            if (this.localData.maximum.scaledValue != null) {
                const maximumActualValue = this.localData.maximum.scaledValue * this.localData.maximum.multiplier;
                if (maximumActualValue <= 0 && !this.allowNegative) {
                    hasError = true;
                    this.errorMessages += "Maximum value must be greater than 0.\n"
                }
            }
            if (this.localData.maximum.scaledValue != null && this.localData.nominal.scaledValue != null && !this.allowUnsorted) {
                const nominalActualValue = this.localData.nominal.scaledValue * this.localData.nominal.multiplier;
                const maximumActualValue = this.localData.maximum.scaledValue * this.localData.maximum.multiplier;
                if (nominalActualValue >= maximumActualValue) {
                    hasError = true;
                    this.errorMessages += "Nominal value must be smaller than maximum value. Change or delete one of the fields.\n"
                }
            }
            if (this.localData.minimum.scaledValue != null && this.localData.nominal.scaledValue != null && !this.allowUnsorted) {
                const nominalActualValue = this.localData.nominal.scaledValue * this.localData.nominal.multiplier;
                const minimumActualValue = this.localData.minimum.scaledValue * this.localData.minimum.multiplier;
                if (nominalActualValue <= minimumActualValue) {
                    hasError = true;
                    this.errorMessages += "Nominal value must be greater than minimum value. Change or delete one of the fields.\n"
                }
            }
            if (this.localData.minimum.scaledValue != null && this.localData.maximum.scaledValue != null && !this.allowUnsorted) {
                const maximumActualValue = this.localData.maximum.scaledValue * this.localData.maximum.multiplier;
                const minimumActualValue = this.localData.minimum.scaledValue * this.localData.minimum.multiplier;
                if (maximumActualValue <= minimumActualValue) {
                    hasError = true;
                    this.errorMessages += "Maximum value must be greater than minimum value. Change or delete one of the fields.\n"
                }
            }
            return hasError;
        },
        update(field, actualValue) {
            const aux = getMultiplier(actualValue, 0.001, this.disabledScaling);
            this.localData[field].scaledValue = aux.scaledValue;
            this.localData[field].multiplier = aux.multiplier;
            const hasError = this.checkErrors();
            if (!hasError) {
                this.modelValue[field] = actualValue;
                this.$emit("update", field, actualValue);
            }
        },
        changeMultiplier(field) {
            if (isNaN(this.localData[field].scaledValue)) {
                const aux = getMultiplier(this.defaultValue[this.defaultField], 0.001, this.disabledScaling);
                this.localData[field].scaledValue = aux.scaledValue;
            }
            const actualValue = this.localData[field].scaledValue * this.localData[field].multiplier;
            this.update(field, actualValue);
        },
        add(field) {
            let newValue = this.defaultValue[field];
            if (field == 'minimum') {
                if (this.localData.nominal.scaledValue != null) {
                    newValue = this.localData.nominal.scaledValue / 2;
                    newValue *= this.localData.nominal.multiplier;
                }
                else if (this.localData.maximum.scaledValue != null) {
                    newValue = this.localData.maximum.scaledValue / 2;
                    newValue *= this.localData.maximum.multiplier;
                }
            }
            if (field == 'nominal') {
                if (this.localData.minimum.scaledValue != null && this.localData.maximum.scaledValue != null) {
                    const maximumActualValue = this.localData.maximum.scaledValue * this.localData.maximum.multiplier;
                    const minimumActualValue = this.localData.minimum.scaledValue * this.localData.minimum.multiplier;
                    newValue = (minimumActualValue + maximumActualValue) / 2;
                }
                else if (this.localData.minimum.scaledValue != null) {
                    newValue = this.localData.minimum.scaledValue * 2;
                    newValue *= this.localData.minimum.multiplier;
                }
                else if (this.localData.maximum.scaledValue != null) {
                    newValue = this.localData.maximum.scaledValue / 2;
                    newValue *= this.localData.maximum.multiplier;
                }
            }
            if (field == 'maximum') {
                if (this.localData.nominal.scaledValue != null) {
                    newValue = this.localData.nominal.scaledValue * 2;
                    newValue *= this.localData.nominal.multiplier;
                }
                else if (this.localData.minimum.scaledValue != null) {
                    newValue = this.localData.minimum.scaledValue * 2;
                    newValue *= this.localData.minimum.multiplier;
                }
            }
            this.update(field, newValue);
        },
        removeField(field) {
            this.localData[field].scaledValue = null;
            this.localData[field].multiplier = null;
            const hasError = this.checkErrors();
            if (!hasError) {
                this.modelValue[field] = null;
            }
            else {
                this.$emit("hasError")
            }
        },
        changeScaledValue(value, field) {
            if (isNaN(this.localData[field].multiplier)) {
                const aux = getMultiplier(this.defaultValue[this.defaultField], 0.001, this.disabledScaling);
                this.localData[field].multiplier = aux.multiplier;
            }
            if (value == '' || (value < 0 && ! this.allowNegative)) {
                this.removeField(field);
            }
            else {
                const actualValue = value * this.localData[field].multiplier;
                this.update(field, actualValue);
            }
        },
    }
}
</script>


<template>
    <div v-tooltip="styleTooltip" class="grid m-0 p-0 text-left">
        <div class="col-12 grid m-0 p-0">
            <input
                :style="combinedStyle([labelBgColor, textColor, titleFontSize])"
                v-tooltip="tooltipsMagneticSynthesisDesignRequirements['changeNameWindings']"
                v-if="varText"
                :data-cy="dataTestLabel + '-title'"
                type="text"
                class="border-round col-6 p-0 mb-2 border-none"
                :class="combinedClass([labelBgColor, textColor, titleFontSize])"
                @change="$emit('changeText', $event.target.value)"
                :value="name">
            <label
                :style="combinedStyle([labelBgColor, textColor, titleFontSize])"
                v-if="!varText"
                :data-cy="dataTestLabel + '-title'"
                :class="combinedClass([labelBgColor, textColor, titleFontSize])"
                class="border-round p-0">
                {{toTitleCase(name)}}
            </label> 
        </div>
        <div class="col-12 grid"></div>
        <div class="col-12 grid">
            <div v-if="!halfSize" class=" sm:col-0 md:col-2"></div>
            <div v-if="localData.minimum.scaledValue != null" :class="severalRows? 'col-12' : halfSize? 'md:col-4 col-12' : 'md:col-3 col-12'" class=" grid m-0 px-0 align-items-center ">
                <button
                    :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                    :data-cy="dataTestLabel + '-minimum-remove-button'"
                    :for="name + 'minimum-input'"
                    :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                    class="remove-button m-0 px-0 col-4 p-form-label text-center p-button"
                    @click="removeField('minimum')"
                    style="max-height: 2.3em;">
                        <span class="normal-text" >Min.</span> <i class="fa-solid fa-xmark icon" ></i>
                </button>
                <input
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    :data-cy="dataTestLabel + '-minimum-number-input'"
                    type="number"
                    class="m-0 px-0 col-4 text-right"
                    :id="name + 'minimum-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-none' : ''])"
                    @change="changeScaledValue($event.target.value, 'minimum')"
                    :value="localData.minimum.scaledValue"
                />
                <DimensionUnit
                    :data-cy="dataTestLabel + '-minimum-DimensionUnit-input'"
                    :min="min"
                    :max="max"
                    v-if="unit != null"
                    :unit="unit"
                    v-model="localData.minimum.multiplier"
                    :extraStyleClass="unitExtraStyleClass"
                    :valueBgColor="valueBgColor"
                    :valueFontSize="valueFontSize"
                    :textColor="textColor"
                    class="m-0 col-4 pl-1"
                    @update:modelValue="changeMultiplier('minimum')"
                />
            </div>
            <div v-if="localData.minimum.scaledValue == null" :class="severalRows? 'col-12 px-5' : 'md:col-3 xl:px-3 md:px-0'" class="grid m-0">
                <button
                    :style="addButtonStyle"
                    :data-cy="dataTestLabel + '-minimum-add-button'"
                    :class="(halfSize? 'mx-0 px-0' : '') + ' ' + valueFontSize"
                    class="p-button float-right"
                    style="max-height: 2.5em"
                    @click="add('minimum')"
                >
                    {{shortenedButtonLabels.minimum}}
                </button>
            </div>

            <div v-if="localData.nominal.scaledValue != null" :class="severalRows? 'col-12' : halfSize? 'md:col-4 col-12' : 'md:col-3 col-12'" class="grid m-0 px-0 align-items-center ">
                <button
                    :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                    :data-cy="dataTestLabel + '-nominal-remove-button'"
                    :for="name + 'nominal-input'"
                    class="remove-button m-0 px-0 col-4 p-form-label text-center p-button"
                    :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                    @click="removeField('nominal')"
                    style="max-height: 2.3em;">
                        <span class="normal-text" >Nom.</span> <i class="fa-solid fa-xmark icon" ></i>
                </button>
                <input
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    :data-cy="dataTestLabel + '-nominal-number-input'"
                    type="number"
                    class="m-0 px-0 col-4 text-right"
                    :id="name + 'nominal-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-none' : ''])"
                    @change="changeScaledValue($event.target.value, 'nominal')"
                    :value="localData.nominal.scaledValue"
                />
                <DimensionUnit
                    :data-cy="dataTestLabel + '-nominal-DimensionUnit-input'"
                    :min="min"
                    :max="max"
                    v-if="unit != null"
                    :unit="unit"
                    v-model="localData.nominal.multiplier"
                    :extraStyleClass="unitExtraStyleClass"
                    :valueBgColor="valueBgColor"
                    :valueFontSize="valueFontSize"
                    :textColor="textColor"
                    class="m-0 col-4 pl-1"
                    @update:modelValue="changeMultiplier('nominal')"
                />
            </div>
            <div v-if="localData.nominal.scaledValue == null" :class="severalRows? 'col-12 px-5' : 'md:col-3 xl:px-3 md:px-0'" class="grid m-0">
                <button
                    :style="addButtonStyle"
                    :data-cy="dataTestLabel + '-nominal-add-button'"
                    :class="(halfSize? 'mx-0 px-0' : '') + ' ' + valueFontSize"
                    class="p-button float-right"
                    style="max-height: 2.5em"
                    @click="add('nominal')">{{shortenedButtonLabels.nominal}}
                </button>
            </div>

            <div v-if="localData.maximum.scaledValue != null" :class="severalRows? 'col-12' : halfSize? 'md:col-4 col-12' : 'md:col-3 col-12'" class="grid m-0 px-0 align-items-center ">
                <button
                    :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                    :data-cy="dataTestLabel + '-maximum-remove-button'"
                    :for="name + 'maximum-input'"
                    class="remove-button m-0 px-0 col-4 p-form-label text-center p-button"
                    :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                    @click="removeField('maximum')"
                    style="max-height: 2.3em;">
                        <span class="normal-text">Max.</span> <i class="fa-solid fa-xmark icon" ></i>
                </button>
                <input
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    :data-cy="dataTestLabel + '-maximum-number-input'"
                    type="number"
                    class="m-0 px-0 col-4 text-right"
                    :id="name + 'maximum-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-none' : ''])"
                    @change="changeScaledValue($event.target.value, 'maximum')"
                    :value="localData.maximum.scaledValue"
                />
                <DimensionUnit
                    :data-cy="dataTestLabel + '-maximum-DimensionUnit-input'"
                    :min="min"
                    :max="max"
                    v-if="unit != null"
                    :unit="unit"
                    v-model="localData.maximum.multiplier"
                    :extraStyleClass="unitExtraStyleClass"
                    :valueBgColor="valueBgColor"
                    :valueFontSize="valueFontSize"
                    :textColor="textColor"                    
                    class="m-0 col-4 pl-1"
                    @update:modelValue="changeMultiplier('maximum')"
                />
            </div>
            <div v-if="localData.maximum.scaledValue == null" :class="severalRows? 'col-12 px-5' : 'md:col-3 xl:px-3 md:px-0'" class="grid m-0">
                <button
                    :style="addButtonStyle"
                    :data-cy="dataTestLabel + '-maximum-add-button'"
                    :class="(halfSize? 'mx-0 px-0' : '') + ' ' + valueFontSize"
                    class="p-button float-right "
                    style="max-height: 2.5em"
                    @click="add('maximum')">{{shortenedButtonLabels.maximum}}
                </button>
            </div>
        </div>
        <div class="col-12 grid">
            <label :data-cy="dataTestLabel + '-error-text'" class="text-red-500 text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>

<style type="text/css">
.remove-button {
  display: block;
}

.remove-button:hover .normal-text {
  display: none;
}
.remove-button:hover {
  background-color: #dc3545 !important;
}

.remove-button .icon {opacity:0;}
.remove-button:hover .icon {opacity:1;}
</style>