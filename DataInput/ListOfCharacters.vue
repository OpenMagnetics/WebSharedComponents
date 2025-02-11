<script setup>
import { toTitleCase, getMultiplier, combinedStyle, combinedClass } from '../assets/js/utils.js'
import * as Utils from '../assets/js/utils.js'
</script>

<script>
export default {
    props: {
        name:{
            type: String,
            required: true
        },
        replaceTitle:{
            type: String,
            default: null
        },
        modelValue:{
            type: String,
            required: true
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
        allowedCharacters: {
            type: String,
            required: true,
        },
        allowConsecutive: {
            type: Boolean,
            default: false,
        },
        allowMissing: {
            type: Boolean,
            default: false,
        },
        valueFontSize: {
            type: [String, Object],
            default: 'fs-6'
        },
        labelFontSize:{
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
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        var localData = "";

        if (this.modelValue != null) {
            localData = this.modelValue;
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
        'modelValue': {
            handler(newValue, oldValue) {
                this.changeText(newValue);
            },
            deep: true
        },
    },
    mounted() {
    },
    methods: {
        changeText(newValue) {
            const newValueArray = newValue.split('');
            const allowedCharactersArray = this.allowedCharacters.split('');

            this.localData = "";
            newValueArray.forEach((newChar) => {
                var found = false;
                allowedCharactersArray.forEach((allowedChar) => {
                    if (allowedChar == newChar) {
                        found = true;
                    }
                });
                if (found) {
                    this.localData += newChar;
                }
            });

            var missingValues = false;
            var missingValue = "";
            if (!this.allowMissing) {
                allowedCharactersArray.forEach((allowedChar) => {
                    var found = false;
                    newValueArray.forEach((newChar) => {
                        if (allowedChar == newChar) {
                            found = true;
                        }
                    });
                    if (!found) {
                        missingValue = allowedChar;
                        missingValues = true;
                    }
                });
            }

            var consecutiveValues = false;
            if (!this.allowConsecutive) {
                for (var i = 0; i < newValueArray.length - 1; i++) {
                    if (newValueArray[i] == newValueArray[i + 1]) {
                        consecutiveValues = true;
                    }
                }
            }

            if (this.localData == '') {
                this.errorMessages = "Field cannot be empty";
                this.$emit("hasError");
            }
            else if (consecutiveValues) {
                this.errorMessages = "Field cannot have repeated consecutive values";
                this.$emit("hasError");
            }
            else if (missingValues) {
                this.errorMessages = "Field cannot have missing values. Missing " + missingValue;
                this.$emit("hasError");
            }
            else {
                this.errorMessages = "";
                this.$emit('updateModelValue', this.localData);
                this.$emit('update');
            }
        }
    }
}
</script>


<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex">
        <div class="row">
            <label
                :style="combinedStyle([labelBgColor, textColor, labelFontSize])"
                v-if="replaceTitle == null"
                :data-cy="dataTestLabel + '-title'"
                :for="name + '-text-input'"
                :class="combinedClass([labelBgColor, textColor, labelFontSize])"
                class="rounded-2 m-0 col-8"
            >
                {{toTitleCase(name)}}
            </label>
            <label
                :style="combinedStyle([labelBgColor, textColor, labelFontSize])"
                v-if="replaceTitle != null"
                :data-cy="dataTestLabel + '-title'"
                :for="name + '-text-input'"
                :class="combinedClass([labelBgColor, textColor, labelFontSize])"
                class="rounded-2 m-0 col-8"
            >
                {{replaceTitle}}
            </label>

            <input
                :style="combinedStyle([valueBgColor, textColor, valueFontSize])"
                :data-cy="dataTestLabel + '-text-input'"
                type="text"
                :disabled="disabled"
                :class="combinedClass([valueBgColor, textColor, valueFontSize])"
                class="m-0 px-0 col-4"
                :id="name + '-text-input'"
                @change="changeText($event.target.value)"
                :value="localData"
            >
            <label class="text-danger text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>


