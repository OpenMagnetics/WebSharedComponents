<script setup>
import { toTitleCase } from '/src/assets/js/utils.js'
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
        canBeEmpty: {
            type: Boolean,
            default: true,
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
        labelStyleClass:{
            type: String,
            default: 'col-4'
        },
        inputStyleClass: {
            type: String,
            default: "m-0 px-0 col-8",
        },
    },
    data() {
        var localData = "";

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
    <div :data-cy="dataTestLabel + '-container'" class="container-flex">
        <div class="row">
            <label :data-cy="dataTestLabel + '-title'" :for="name + '-text-input'" :class="labelStyleClass + ' ' + labelBgColor + ' ' + textColor" class="rounded-2 fs-5 ">{{toTitleCase(name)}}</label>
            <input :data-cy="dataTestLabel + '-text-input'" type="text" :class="inputStyleClass + ' ' + inputBgColor + ' ' + textColor" class="m-0 px-0" :id="name + '-text-input'" @change="changeText($event.target.value)" :value="localData">
            <label class="text-danger text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>


