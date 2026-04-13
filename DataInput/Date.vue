<script setup>
import { toTitleCase, combinedStyle, combinedClass } from '../assets/js/utils.js'
import VueDatePicker from '@vuepic/vue-datepicker';
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
        defaultValue:{
            type: String,
            default: '',
        },
        dataTestLabel: {
            type: String,
            default: '',
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
        labelWidthProportionClass:{
            type: String,
            default: 'col-4'
        },
        inputStyleClass: {
            type: String,
            default: "m-0 px-0 col-8",
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
            this.modelValue[this.name] = newValue[this.name];
        },
    },
    mounted () {
    },
    methods: {
        changeText(newValue) {
            if (newValue == '') {
                this.errorMessages = toTitleCase(name) + " cannot be empty. Please write a name."
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
    <div :data-cy="dataTestLabel + '-container'" class="container-flex">
        <div class="row">
            <label
                :style="combinedStyle([labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                :for="name + '-date-input'"
                :class="combinedClass([labelWidthProportionClass, labelBgColor, textColor])"
                class="data-input-label fs-5 col-3 "
            >
                {{toTitleCase(name)}}
            </label>
            <div :class="inputStyleClass">
                <VueDatePicker
                    v-model="modelValue[name]"
                    auto-apply
                    :class="valueBgColor + ' ' + textColor" class="data-input-date m-0 p-0" :id="name + '-date-input'"
                    format='dd/MM/yyyy'
                    />
            </div>
        </div>
    </div>
</template>

<style scoped>
.data-input-label {
    border-radius: var(--p-border-radius);
    font-size: clamp(0.625rem, 1.2vw, 0.875rem);
}

.data-input-date :deep(input) {
    border: 1px solid var(--p-surface-400);
    border-radius: var(--p-border-radius);
    font-family: var(--p-font-family);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    height: 1.75rem;
    line-height: 1.25rem;
}

.data-input-date :deep(input:focus) {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 0 0.15rem color-mix(in srgb, var(--p-primary-color) 25%, transparent);
}
</style>
