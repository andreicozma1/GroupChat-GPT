<template>
    <div>
        <q-badge v-for="(value, key) in modelUsage"
                 :key="key"
                 :color="getSeededQColor(key + '^', 4, 5)"
                 :label="`${key.replace('_tokens', '')}: ${value}`"
                 class="q-mr-xs"
                 v-bind="badgeProps">
        </q-badge>
    </div>

</template>
<script lang="ts"
        setup>
import {defineProps} from "vue";
import {getSeededQColor} from "src/util/Colors";

const props = defineProps({
	modelUsage: {
		type: Object,
	},
	badgeProps: {
		type: Object,
		required: false,
		default: null,
	},
});


</script>

