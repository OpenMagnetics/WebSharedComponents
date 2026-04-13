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
            default: () => ({ fontSize: '0.875rem' })
        },
        labelFontSize:{
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
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        let localData = "";

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
                let found = false;
                allowedCharactersArray.forEach((allowedChar) => {
                    if (allowedChar == newChar) {
                        found = true;
                    }
                });
                if (found) {
                    this.localData += newChar;
                }
            });

            let missingValues = false;
            let missingValue = "";
            if (!this.allowMissing) {
                allowedCharactersArray.forEach((allowedChar) => {
                    let found = false;
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

            let consecutiveValues = false;
            if (!this.allowConsecutive) {
                for (let i = 0; i < newValueArray.length - 1; i++) {
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
                class="list-chars-label m-0 col-8"
            >
                {{toTitleCase(name)}}
            </label>
            <label
                :style="combinedStyle([labelBgColor, textColor, labelFontSize])"
                v-if="replaceTitle != null"
                :data-cy="dataTestLabel + '-title'"
                :for="name + '-text-input'"
                :class="combinedClass([labelBgColor, textColor, labelFontSize])"
                class="list-chars-label m-0 col-8"
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
            <label class="list-chars-error text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages}}</label>
        </div>
    </div>
</template>

<style scoped>
.list-chars-label {
    font-size: clamp(0.6rem, 2cqi, 0.875rem);
    overflow: hidden;
    white-space: nowrap;
    container-type: inline-size;
    border-radius: var(--p-border-radius);
}
.list-chars-error {
    color: var(--p-red-400);
}
</style>
