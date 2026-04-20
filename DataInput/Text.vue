<script setup>
import { toTitleCase, combinedStyle, combinedClass } from '../assets/js/utils.js'
</script>

<script>
export default {
    props: {
        name: {
            type: String,
            required: true
        },
        modelValue: {
            type: Object,
            required: true
        },
        defaultValue: {
            type: String,
            default: '',
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        replaceTitle:{
            type: String,
            default: null,
        },
        canBeEmpty: {
            type: Boolean,
            default: true,
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
        labelWidthProportionClass: {
            type: String,
            default: 'col-4'
        },
        valueWidthProportionClass: {
            type: String,
            default: " col-8",
        },
        extraStyleClass:{
            type: String,
            default: ''
        },
    },
    data() {
        let localData = "";

        if (this.modelValue[this.name] == null &&
            this.defaultValue != null) {
            localData = this.defaultValue;
        }

        if (this.modelValue[this.name] != null) {
            localData = this.modelValue[this.name];
        }

        const errorMessages = ''

        return {
            localData,
            errorMessages
        }
    },
    computed: {
    },
    watch: { 
        modelValue(newValue, oldValue) {
            this.localData = newValue[this.name];
            setTimeout(() => {this.changeText(newValue[this.name]);}, 10);
        },
    },
    mounted () {
        this.changeText(this.modelValue[this.name])
    },
    methods: {
        changeText(newValue) {
            if (newValue == '' && !this.canBeEmpty) {
                this.errorMessages = toTitleCase(name) + " cannot be empty. Please enter a value."
                this.$emit("hasError")
            }
            else {
                this.errorMessages = ""
                this.modelValue[this.name] = newValue;
            }
        }
    }
}
</script>


<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex px-2 m-0">
        <div class="row">
            <label
                v-if="labelWidthProportionClass != 'col-0'"
                :style="combinedStyle([labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                :for="name + '-text-input'"
                :class="combinedClass([labelWidthProportionClass, labelBgColor, textColor])"
                class="data-input-label fs-5 "
            >
                {{replaceTitle != null? replaceTitle : toTitleCase(name)}}
            </label>
            <input
                :style="combinedStyle([valueWidthProportionClass, valueBgColor, textColor, extraStyleClass])"
                :data-cy="dataTestLabel + '-text-input'"
                type="text"
                :class="combinedClass([valueWidthProportionClass, valueBgColor, textColor, extraStyleClass])"
                class="data-input-text m-0 px-0 "
                :id="name + '-text-input'"
                @change="changeText($event.target.value)"
                :value="localData"
            >
            <label class="data-input-error text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>

<style scoped>
.data-input-label {
    border-radius: var(--p-border-radius);
    font-size: clamp(0.625rem, 1.2vw, 0.875rem);
}

.data-input-text {
    border: 1px solid var(--p-surface-400);
    border-radius: var(--p-border-radius);
    font-family: var(--p-font-family);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    height: 1.75rem;
    line-height: 1.25rem;
}

.data-input-text:focus {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 0 0.15rem color-mix(in srgb, var(--p-primary-color) 25%, transparent);
}

.data-input-error {
    color: var(--p-red-400);
}
</style>
