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
            default: () => ({})
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
            default: () => ({}),
        },
        removeButtonBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-red-400)' }),
        },
        valueFontSize: {
            type: [String, Object],
            default: () => ({ fontSize: '0.875rem' })
        },
        titleFontSize: {
            type: [String, Object],
            default: () => ({ fontSize: '0.875rem' })
        },
        labelBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-surface-800)' }),
        },
        valueBgColor: {
            type: [String, Object],
            default: () => ({ backgroundColor: 'var(--p-surface-600)' }),
        },
        textColor: {
            type: [String, Object],
            default: () => ({ color: 'var(--p-surface-50)' }),
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
    <div class="container-flex m-0 p-0 text-start">
        <div class="row m-0 p-0">
            <input
                :style="combinedStyle([labelBgColor, textColor, titleFontSize])"
                v-if="varText"
                :data-cy="dataTestLabel + '-title'"
                type="text"
                class="dwt-rounded col-6 p-0 mb-2 border-0"
                :class="combinedClass([labelBgColor, textColor, titleFontSize])"
                @change="$emit('changeText', $event.target.value)"
                :value="name">
            <label
                :style="combinedStyle([labelBgColor, textColor, titleFontSize])"
                v-if="!varText"
                :data-cy="dataTestLabel + '-title'"
                :class="combinedClass([labelBgColor, textColor, titleFontSize])"
                class="dwt-rounded p-0">
                {{toTitleCase(name)}}
            </label> 
        </div>
        <div class="row"></div>
        <div class="row">
            <div v-if="!halfSize" class=" col-sm-0 col-md-2"></div>
            <div v-if="localData.minimum.scaledValue != null" :class="severalRows? 'col-12' : halfSize? 'col-md-4 col-xs-12' : 'col-md-3 col-xs-12'" class=" row m-0 px-0 align-items-center ">
                <button
                    :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                    :data-cy="dataTestLabel + '-minimum-remove-button'"
                    :for="name + 'minimum-input'"
                    :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                    class="remove-button m-0 px-0 col-4 col-form-label text-center btn"
                    @click="removeField('minimum')"
                    style="max-height: 2.3em;">
                        <span class="normal-text" >Min.</span> <i class="bi bi-x-lg icon" ></i>
                </button>
                <input
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    :data-cy="dataTestLabel + '-minimum-number-input'"
                    type="number"
                    class="m-0 px-0 col-4 text-end"
                    :id="name + 'minimum-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-0' : ''])"
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
                    class="m-0 col-4 ps-1"
                    @update:modelValue="changeMultiplier('minimum')"
                />
            </div>
            <div v-if="localData.minimum.scaledValue == null" :class="severalRows? 'col-12 px-5' : 'col-md-3 px-xl-3 px-md-0'" class="row m-0">
                <button
                    :data-cy="dataTestLabel + '-minimum-add-button'"
                    :class="[halfSize ? 'mx-0 px-0' : '', 'dwt-add-btn']"
                    @click="add('minimum')"
                >
                    <i class="bi bi-plus-lg"></i>
                    <span>{{shortenedButtonLabels.minimum}}</span>
                </button>
            </div>

            <div v-if="localData.nominal.scaledValue != null" :class="severalRows? 'col-12' : halfSize? 'col-md-4 col-xs-12' : 'col-md-3 col-xs-12'" class="row m-0 px-0 align-items-center ">
                <button
                    :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                    :data-cy="dataTestLabel + '-nominal-remove-button'"
                    :for="name + 'nominal-input'"
                    class="remove-button m-0 px-0 col-4 col-form-label text-center btn"
                    :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                    @click="removeField('nominal')"
                    style="max-height: 2.3em;">
                        <span class="normal-text" >Nom.</span> <i class="bi bi-x-lg icon" ></i>
                </button>
                <input
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    :data-cy="dataTestLabel + '-nominal-number-input'"
                    type="number"
                    class="m-0 px-0 col-4 text-end"
                    :id="name + 'nominal-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-0' : ''])"
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
                    class="m-0 col-4 ps-1"
                    @update:modelValue="changeMultiplier('nominal')"
                />
            </div>
            <div v-if="localData.nominal.scaledValue == null" :class="severalRows? 'col-12 px-5' : 'col-md-3 px-xl-3 px-md-0'" class="row m-0">
                <button
                    :data-cy="dataTestLabel + '-nominal-add-button'"
                    :class="[halfSize ? 'mx-0 px-0' : '', 'dwt-add-btn']"
                    @click="add('nominal')">
                    <i class="bi bi-plus-lg"></i>
                    <span>{{shortenedButtonLabels.nominal}}</span>
                </button>
            </div>

            <div v-if="localData.maximum.scaledValue != null" :class="severalRows? 'col-12' : halfSize? 'col-md-4 col-xs-12' : 'col-md-3 col-xs-12'" class="row m-0 px-0 align-items-center ">
                <button
                    :style="combinedStyle([valueFontSize, labelBgColor, textColor])"
                    :data-cy="dataTestLabel + '-maximum-remove-button'"
                    :for="name + 'maximum-input'"
                    class="remove-button m-0 px-0 col-4 col-form-label text-center btn"
                    :class="combinedClass([valueFontSize, labelBgColor, textColor])"
                    @click="removeField('maximum')"
                    style="max-height: 2.3em;">
                        <span class="normal-text">Max.</span> <i class="bi bi-x-lg icon" ></i>
                </button>
                <input
                    :style="combinedStyle([disabled? labelBgColor : valueBgColor, textColor, valueFontSize])"
                    :data-cy="dataTestLabel + '-maximum-number-input'"
                    type="number"
                    class="m-0 px-0 col-4 text-end"
                    :id="name + 'maximum-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-0' : ''])"
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
                    class="m-0 col-4 ps-1"
                    @update:modelValue="changeMultiplier('maximum')"
                />
            </div>
            <div v-if="localData.maximum.scaledValue == null" :class="severalRows? 'col-12 px-5' : 'col-md-3 px-xl-3 px-md-0'" class="row m-0">
                <button
                    :data-cy="dataTestLabel + '-maximum-add-button'"
                    :class="[halfSize ? 'mx-0 px-0' : '', 'dwt-add-btn']"
                    @click="add('maximum')">
                    <i class="bi bi-plus-lg"></i>
                    <span>{{shortenedButtonLabels.maximum}}</span>
                </button>
            </div>
        </div>
        <div class="row">
            <label :data-cy="dataTestLabel + '-error-text'" class="dwt-error text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>

<style scoped>
.dwt-rounded {
  border-radius: var(--p-border-radius);
}

.dwt-error {
  color: var(--p-red-400);
  font-size: 0.78rem !important;
}

/* ============ Min / Nom / Max "remove" pill ============ */
.remove-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(var(--bs-primary-rgb), 0.45) !important;
  border-right: none !important;
  border-radius: 999px 0 0 999px !important;
  background: rgba(var(--bs-primary-rgb), 0.12) !important;
  color: var(--bs-primary) !important;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 0 0.55rem !important;
  height: 1.75rem !important;
  line-height: 1.25rem;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.remove-button:hover .normal-text {
  display: none;
}
.remove-button:hover {
  background: rgb(var(--bs-danger-rgb) / 0.25) !important;
  border-color: rgb(var(--bs-danger-rgb) / 0.65) !important;
  color: var(--bs-danger) !important;
}

.remove-button .icon { opacity: 0; }
.remove-button:hover .icon { opacity: 1; }

/* ============ Value input ============ */
input[type="number"],
input[type="text"] {
  border: 1px solid rgba(var(--bs-primary-rgb), 0.25);
  border-radius: 0;
  border-right: none;
  font-family: var(--p-font-family);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  height: 1.75rem;
  line-height: 1.25rem;
  padding: 0 0.5rem;
}

input[type="number"]:focus,
input[type="text"]:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.15rem rgba(var(--bs-primary-rgb), 0.25);
  position: relative;
  z-index: 1;
}

/* ============ Unit select on the right ============ */
:deep(.unit-select) {
  height: 1.75rem !important;
  min-height: 1.75rem !important;
  max-height: 1.75rem !important;
  /* Match line-height to the box height so the option text vertically
     centers inside the select — `align-items: center` doesn't apply to
     text inside <select> in any browser. */
  line-height: 1.75rem !important;
  padding: 0 1.25rem 0 0.5rem !important; /* leave room for the chevron */
  margin: 0 !important;
  vertical-align: middle !important;
  border-radius: 0 999px 999px 0 !important;
  border: 1px solid rgba(var(--bs-primary-rgb), 0.25) !important;
  box-sizing: border-box !important;
  text-align: left !important;
  text-align-last: left !important;
}

/* Force the input/select pair to share the same baseline regardless of any
   parent's residual padding from `col-form-label`. */
input[type="number"],
input[type="text"] {
  vertical-align: middle;
  margin: 0 !important;
}

.row.align-items-center {
  align-items: center !important;
}

.row.align-items-center > * {
  align-self: center !important;
}

/* ============ "Add min./nom./max." pill button ============ */
button.dwt-add-btn {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.35rem 0.9rem !important;
  border-radius: 999px !important;
  font-size: 0.78rem !important;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  border: 1px solid rgba(var(--bs-primary-rgb), 0.85) !important;
  background-color: var(--bs-primary) !important;
  background-image: linear-gradient(135deg,
      rgba(var(--bs-primary-rgb), 1) 0%,
      rgba(var(--bs-primary-rgb), 0.8) 100%) !important;
  color: #ffffff !important;
  box-shadow:
      0 0 0 1px rgb(var(--bs-primary-rgb) / 0.3),
      0 2px 6px rgb(var(--bs-primary-rgb) / 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
  transition: filter 0.15s, transform 0.1s, box-shadow 0.2s;
  white-space: nowrap;
  min-height: 1.75rem;
  height: 1.75rem;
  width: auto;
  line-height: 1 !important;
  outline: none;
}

.dwt-add-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.dwt-add-btn i {
  font-size: 0.68rem;
}

/* ============ Title label ============ */
.dwt-rounded {
  color: var(--bs-primary) !important;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: transparent !important;
}
</style>