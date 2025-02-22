<script setup>
import { toTitleCase, getMultiplier, combinedStyle, combinedClass } from '../assets/js/utils.js'
import { ColorPicker } from "vue3-colorpicker";
import "vue3-colorpicker/style.css";

</script>
<script>
export default {
    components: {
        ColorPicker,
    },
    props: {
        name:{
            type: String,
            required: true
        },
        modelValue:{
            type: Object,
            required: true
        },
        colors:{
            type: Object,
            required: true
        },
        options:{
            type: Object,
            required: true
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        optionsToDisable: {
            type: Array,
            default: [],
        },
        classInput: {
            type: String,
            default: 'col-lg-6 col-xl-2',
        },
        justifyContent: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        valueFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        labelFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        labelBgColor: {
            type: [String, Object],
            default: "bg-dark",
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
        return {
        }
    },
    computed: {
        selectedLabel() {
        }
    },
    watch: { 
    },
    mounted () {
        Object.keys(this.options).forEach((value) => {
            if (!(value in this.colors)) {
                this.colors[value] = this.getRandomColor()
            }
        })
    },
    methods: {
        getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        },
        changedCheckedValue(checkedValue) {
            var found = false;
            var newList = [];
            for (let [key, value] of Object.entries(this.modelValue[this.name])) {
                if (value == checkedValue) {
                    found = true;
                }
                else {
                    newList.push(value);
                }
        
            }
            if (!found) {
                this.modelValue[this.name].push(checkedValue);
            }
            else {
                this.modelValue[this.name] = newList;
            }
            this.$emit("update", checkedValue, this.name);
        },
    }
}
</script>

<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex ">
        <div class="row">
            <label
                :style="combinedStyle([labelBgColor, textColor, labelFontSize])"
                :data-cy="dataTestLabel + '-title'"
                class="rounded-2 fs-5 "
                :class="combinedClass([justifyContent? 'text-start ms-0' : 'ms-3', labelBgColor, textColor, labelFontSize])"
            >
                {{toTitleCase(name)}}
            </label>
        </div>
            <div :class="classInput" class="form-check ms-4 " v-for="[key, value] in Object.entries(options)">
                <input
                    :style="combinedStyle([textColor])"
                    :disabled="optionsToDisable.includes(value) || disabled"
                    :data-cy="dataTestLabel + '-' + value + '-checkbox-input'"
                    :ref="key"
                    class="form-check-input border"
                    type="checkbox"
                    :checked="modelValue[name].includes(value)"
                    :id="name + '-checkbox-input'"
                    :class="combinedClass([disabled? labelBgColor : valueBgColor, textColor, valueFontSize, disabled? 'border-0' : ''])"
                    @change="changedCheckedValue(value)"
                >
                <label 
                    :style="combinedStyle([labelBgColor, textColor, valueFontSize])"
                    class="form-check-label col-3"
                    :class="combinedClass([labelBgColor, textColor, valueFontSize])"
                    :for="name + '-checkbox-input'">
                    {{value}}
                </label>
                <color-picker
                    v-if="modelValue[name].includes(value)"
                    class="col-3 p-0 m-0"
                    v-model:pureColor="colors[value]"
                    @pureColorChange="$emit('colorChange')"
                />
        </div>
    </div>
</template>

<style>
</style>
