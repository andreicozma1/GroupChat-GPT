<template>
    <q-badge v-for="(value, key) in modelUsage"
             :key="key"
             :color="getBadgeColor(key, value)"
             :label="getBadgeLabel(key, value)"
             class="q-mr-xs"
             v-bind="badgeProps">
        <CustomTooltip>
            {{ getBadgeTooltip(key, value) }}
        </CustomTooltip>
    </q-badge>
</template>
<script lang="ts"
        setup>
import {defineProps} from "vue";
import {getSeededQColor} from "src/util/Colors";
import CustomTooltip from "components/CustomTooltip.vue";

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

const getBadgeColor = (key: string, value: string) => {
	return getSeededQColor(key + '^', 4, 5)
};

const getBadgeLabel = (key: string, value: string) => {
	// key = key.replace('_tokens', '');
	// key = key[0].toUpperCase()
	// return [
	// 	// key,
	// 	value,
	// ].join(': ');
	return value
};

const getBadgeTooltip = (key: string, value: string) => {
	key = key.replace('_tokens', '');
	return [
		value,
		"tokens used in",
		key.toLowerCase()
	].join(' ');
};

</script>

