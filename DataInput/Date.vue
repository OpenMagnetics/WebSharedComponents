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
    <div :data-cy="dataTestLabel + '-container'" class="grid">
        <div class="col-12 grid">
            <label
                :style="combinedStyle([labelWidthProportionClass, labelBgColor, textColor])"
                :data-cy="dataTestLabel + '-title'"
                :for="name + '-date-input'"
                :class="combinedClass([labelWidthProportionClass, labelBgColor, textColor])"
                class="border-round text-xl col-3 "
            >
                {{toTitleCase(name)}}
            </label>
            <div :class="inputStyleClass">
                <VueDatePicker
                    v-model="modelValue[name]"
                    auto-apply
                    :class="valueBgColor + ' ' + textColor" class="m-0 p-0" :id="name + '-date-input'"
                    format='dd/MM/yyyy'
                    />
            </div>
        </div>
    </div>
</template>


