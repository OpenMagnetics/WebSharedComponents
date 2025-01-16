<script setup>
import { toTitleCase } from '../assets/js/utils.js'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
</script>

<script>
export default {
    props: {
        names:{
            type: Array[String],
            required: true
        },
        modelValue:{
            type: Object,
            required: true
        },
        units:{
            type: Array[String],
            required: false
        },
        mins:{
            type: Array[Number],
            default: 1e-12
        },
        maxs:{
            type: Array[Number],
            default: 1e+9
        },
        numberDecimals:{
            type: Array[Number],
            default: 6
        },
        allowNegatives:{
            type: Boolean,
            default: false
        },
        allowZeros:{
            type: Boolean,
            default: false
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        var localData = {};
        var forceUpdate = 0;

        console.log(this.modelValue)
        console.log(this.names)
        if (this.modelValue[this.names[0]] != null) {
            localData[this.names[0]] = this.modelValue[this.names[0]];
        }

        if (this.modelValue[this.names[1]] != null) {
            localData[this.names[1]] = this.modelValue[this.names[1]];
        }

        const errorMessages = ''

        return {
            forceUpdate,
            localData,
            errorMessages
        }
    },
    computed: {
    },
    watch: {
        modelValue(newValue, oldValue) {
            if (this.modelValue[this.names[0]] != null) {
                this.localData[this.names[0]] = this.modelValue[this.names[0]];
            }

            if (this.modelValue[this.names[1]] != null) {
                this.localData[this.names[1]] = this.modelValue[this.names[1]];
            }
            this.forceUpdate += 1;

        },
    },
    mounted () {
    },
    methods: {
        dimensionUpdated(value, dimension) {
            this.modelValue[this.names[dimension]] = value
            this.$emit("update", {value: value, dimension: this.names[dimension]})
        },
    }
}
</script>


<template>
    <div :data-cy="dataTestLabel + '-container'" class="container-flex">
        <div class="row">
            <Dimension class="col-5 offset-1 mb-1 text-start"
                :name="names[0]"
                :replaceTitle="toTitleCase(names[0])"
                :unit="units[0]"
                :dataTestLabel="dataTestLabel + ' ' + names[0]"
                :min="mins[0]"
                :max="maxs[0]"
                :justifyContent="true"
                :forceUpdate="forceUpdate"
                :allowNegatives="allowNegatives[0]"
                :allowZeros="allowZeros[0]"
                :modelValue="localData"
                @update="dimensionUpdated($event, 0)"
                :labelStyleClass="'col-xs-12 col-md-5'"
                :dimensionStyleClass="'col-xs-8 col-md-7'"
                :labelBgColor="$settingsStore.labelBgColor"
                :inputBgColor="$settingsStore.inputBgColor"
                :textColor="$settingsStore.textColor"
            />
            <Dimension class="col-5 offset-1 mb-1 text-start"
                :name="names[1]"
                :replaceTitle="toTitleCase(names[1])"
                :unit="units[1]"
                :dataTestLabel="dataTestLabel + ' ' + names[1]"
                :min="mins[1]"
                :max="maxs[1]"
                :justifyContent="true"
                :forceUpdate="forceUpdate"
                :allowNegatives="allowNegatives[1]"
                :allowZeros="allowZeros[1]"
                :modelValue="localData"
                @update="dimensionUpdated($event, 1)"
                :labelStyleClass="'col-xs-12 col-md-5'"
                :dimensionStyleClass="'col-xs-8 col-md-7'"
                :labelBgColor="$settingsStore.labelBgColor"
                :inputBgColor="$settingsStore.inputBgColor"
                :textColor="$settingsStore.textColor"
            />
        </div>
    </div>
</template>


