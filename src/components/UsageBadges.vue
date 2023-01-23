<template>
    <q-chip v-for="(value, key) in modelUsage"
            :key="key"
            :color="getBadgeColor(key, value)"
            :label="getBadgeLabel(key, value)"
            class="q-my-none text-weight-bold"
            dense
            size="0.55rem">
        <CustomTooltip>
            {{ getBadgeTooltip(key, value) }}
        </CustomTooltip>
    </q-chip>
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
						  });

const getBadgeColor = (key: string, value: string) => {
	return getSeededQColor(key + '^', 4, 5, [], false)
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

