<script setup>
import { toTitleCase } from '/src/assets/js/utils.js'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue';
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
            console.log("this.modelValue[this.name]")
            console.log(this.modelValue[this.name])
            this.modelValue[this.name] = newValue[this.name];
            console.log("newValue[this.name]")
            console.log(newValue[this.name])
            console.log(newValue[this.name])
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
            <label :data-cy="dataTestLabel + '-title'" :for="name + '-date-input'" :class="labelStyleClass + ' ' + labelBgColor + ' ' + textColor" class="rounded-2 fs-5 col-3 ">{{toTitleCase(name)}}</label>
            <div :class="inputStyleClass">
                <VueDatePicker
                    v-model="modelValue[name]"
                    auto-apply
                    :class="inputBgColor + ' ' + textColor" class="m-0 p-0" :id="name + '-date-input'"
                    format='dd/MM/yyyy'
                    />
            </div>
        </div>
    </div>
</template>


